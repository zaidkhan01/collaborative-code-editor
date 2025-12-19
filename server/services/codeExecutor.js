const Docker = require('dockerode');
const { Readable } = require('stream');
const os = require('os');
const { spawn } = require('child_process');

// Strip ANSI escape codes from output
function stripAnsi(str) {
  if (typeof str !== 'string') return str;
  // Matches all ANSI escape sequences
  return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}

class CodeExecutor {
  constructor() {
    // Detect Docker socket path (supports Docker Desktop, Colima, Podman, etc.)
    const possibleSocketPaths = [
      process.env.DOCKER_HOST?.replace('unix://', ''),
      process.env.DOCKER_SOCKET_PATH,
      '/var/run/docker.sock',
      `${process.env.HOME}/.colima/default/docker.sock`,
      `${process.env.HOME}/.colima/docker.sock`,
      `${process.env.HOME}/.docker/run/docker.sock`,
    ].filter(Boolean);

    let dockerOptions = {};
    let connectedSocket = null;

    // Try each socket path
    for (const socketPath of possibleSocketPaths) {
      try {
        const fs = require('fs');
        if (fs.existsSync(socketPath)) {
          dockerOptions = { socketPath };
          connectedSocket = socketPath;
          break;
        }
      } catch (err) {
        continue;
      }
    }
    
    try {
      this.docker = new Docker(dockerOptions);
      this.dockerAvailable = true;
      console.log(`✅ Docker initialized successfully${connectedSocket ? ` (socket: ${connectedSocket})` : ''}`);
    } catch (error) {
      console.warn('⚠️  Docker not available. Using local execution fallback.');
      console.warn('   Tried socket paths:', possibleSocketPaths);
      this.dockerAvailable = false;
    }
    
    this.maxExecutionTime = parseInt(process.env.MAX_EXECUTION_TIME) || 10000; // 10 seconds
    this.maxMemory = parseInt(process.env.MAX_MEMORY_MB) || 128; // 128MB
    
    // Docker images for each language
    this.images = {
      javascript: 'node:18-alpine',
      python: 'python:3.11-alpine',
      java: 'openjdk:17-alpine',
      cpp: 'gcc:latest',
      go: 'golang:1.21-alpine'
    };

    // File extensions
    this.extensions = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      go: 'go'
    };

    // Local execution commands (fallback when Docker unavailable)
    this.localCommands = {
      javascript: 'node',
      python: 'python3'
    };
  }

  async execute(code, language) {
    const startTime = Date.now();

    try {
      // Check if Docker is available
      let useDocker = this.dockerAvailable;

      if (useDocker) {
      try {
        await this.docker.ping();
      } catch (err) {
          console.warn('⚠️  Docker ping failed, falling back to local execution');
          useDocker = false;
        }
      }

      // If Docker not available, try local execution for supported languages
      if (!useDocker) {
        if (this.localCommands[language]) {
          console.log(`📦 Running ${language} locally (Docker unavailable)`);
          const result = await this.executeLocally(code, language);
          const executionTime = Date.now() - startTime;
          return {
            success: !result.error,
            output: result.output,
            error: result.error || '',
            executionTime
          };
        } else {
          throw new Error(`Docker is required for ${language}. Please start Docker Desktop.`);
        }
      }

      // Validate language
      if (!this.images[language]) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Execute based on language
      const result = await this.executeInDocker(code, language);
      
      const executionTime = Date.now() - startTime;

      return {
        success: !result.error,
        output: result.output,
        error: result.error || '',
        executionTime
      };
    } catch (error) {
      console.error('Code execution error:', error);
      return {
        success: false,
        output: '',
        error: error.message || 'Execution failed',
        executionTime: Date.now() - startTime
      };
    }
  }

  // Local execution fallback (for JavaScript and Python)
  async executeLocally(code, language) {
    return new Promise((resolve) => {
      const cmd = this.localCommands[language];
      const args = language === 'javascript' ? ['-e', code] : ['-c', code];
      
      let output = '';
      let error = '';
      
      const proc = spawn(cmd, args, {
        timeout: this.maxExecutionTime,
        maxBuffer: 1024 * 1024, // 1MB
        env: {
          ...process.env,
          NO_COLOR: '1',           // Disable colors for many tools
          FORCE_COLOR: '0',        // Disable colors for chalk/others
          NODE_DISABLE_COLORS: '1' // Disable Node.js colors
        }
      });

      const timeout = setTimeout(() => {
        proc.kill('SIGTERM');
        resolve({ output: '', error: 'Execution timeout exceeded' });
      }, this.maxExecutionTime);

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        error += data.toString();
      });

      proc.on('close', (exitCode) => {
        clearTimeout(timeout);
        resolve({
          output: stripAnsi(output.trim()),
          error: stripAnsi(error.trim())
        });
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        resolve({
          output: '',
          error: err.message
        });
      });
    });
  }

  async executeInDocker(code, language) {
    return new Promise(async (resolve) => {
      let container;
      const timeout = setTimeout(async () => {
        if (container) {
          try {
            await container.kill();
            await container.remove();
          } catch (err) {
            console.error('Error killing container:', err);
          }
        }
        resolve({
          output: '',
          error: 'Execution timeout exceeded'
        });
      }, this.maxExecutionTime);

      try {
        const image = this.images[language];
        
        // Check if image exists, pull if not
        try {
          await this.docker.getImage(image).inspect();
        } catch (error) {
          console.log(`Pulling image: ${image}`);
          await this.pullImage(image);
        }

        // Create command based on language
        const cmd = this.getExecutionCommand(code, language);

        // Create container
        container = await this.docker.createContainer({
          Image: image,
          Cmd: cmd,
          AttachStdout: true,
          AttachStderr: true,
          Tty: false,
          HostConfig: {
            Memory: this.maxMemory * 1024 * 1024, // Convert MB to bytes
            MemorySwap: this.maxMemory * 1024 * 1024,
            NanoCpus: 1000000000, // 1 CPU
            NetworkMode: 'none', // Disable network access
            ReadonlyRootfs: false,
            AutoRemove: false
          }
        });

        // Start container
        await container.start();

        // Get logs
        const stream = await container.logs({
          follow: true,
          stdout: true,
          stderr: true
        });

        let output = '';
        let error = '';

        stream.on('data', (chunk) => {
          const data = chunk.toString('utf8');
          // Docker log format: first 8 bytes are header
          const cleanData = data.slice(8);
          
          if (chunk[0] === 1) { // stdout
            output += cleanData;
          } else if (chunk[0] === 2) { // stderr
            error += cleanData;
          }
        });

        stream.on('end', async () => {
          clearTimeout(timeout);
          
          try {
            await container.remove();
          } catch (err) {
            console.error('Error removing container:', err);
          }

          resolve({
            output: stripAnsi(output.trim()),
            error: stripAnsi(error.trim())
          });
        });

      } catch (err) {
        clearTimeout(timeout);
        if (container) {
          try {
            await container.remove();
          } catch (removeErr) {
            console.error('Error removing container:', removeErr);
          }
        }
        resolve({
          output: '',
          error: err.message
        });
      }
    });
  }

  getExecutionCommand(code, language) {
    const safeCode = code.replace(/'/g, "'\\''"); // Escape single quotes

    switch (language) {
      case 'javascript':
        return ['node', '-e', safeCode];
      
      case 'python':
        return ['python', '-c', safeCode];
      
      case 'java':
        // Java requires a class name
        return ['sh', '-c', `echo '${safeCode}' > Main.java && javac Main.java && java Main`];
      
      case 'cpp':
        return ['sh', '-c', `echo '${safeCode}' > main.cpp && g++ -o main main.cpp && ./main`];
      
      case 'go':
        return ['sh', '-c', `echo '${safeCode}' > main.go && go run main.go`];
      
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  async pullImage(image) {
    return new Promise((resolve, reject) => {
      this.docker.pull(image, (err, stream) => {
        if (err) {
          return reject(err);
        }

        this.docker.modem.followProgress(stream, (err, output) => {
          if (err) {
            return reject(err);
          }
          resolve(output);
        });
      });
    });
  }
}

module.exports = CodeExecutor;

