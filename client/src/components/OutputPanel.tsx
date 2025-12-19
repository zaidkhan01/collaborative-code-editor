import React from 'react';
import { X, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { ExecutionResult } from '../types';

interface OutputPanelProps {
  result: ExecutionResult;
  onClose: () => void;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ result, onClose }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className={`bg-gray-800 border-t border-gray-700 flex flex-col transition-all duration-200 ${isExpanded ? 'h-64' : 'h-12'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <h3 className="text-white font-semibold text-sm">Output</h3>
          {result.success ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{result.executionTime}ms</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Output Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-3 flex gap-4">
          {/* Output Section */}
          <div className="flex-1 min-w-0">
            {result.output ? (
              <>
                <h4 className="text-xs font-semibold text-gray-400 mb-1">Output:</h4>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono whitespace-pre-wrap overflow-auto max-h-40">
                  {result.output}
                </pre>
              </>
            ) : !result.error ? (
              <div className="text-gray-500 text-sm">No output</div>
            ) : null}
          </div>

          {/* Error Section */}
          {result.error && (
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-red-400 mb-1">Error:</h4>
              <pre className="bg-gray-900 text-red-400 p-3 rounded text-sm font-mono whitespace-pre-wrap overflow-auto max-h-40">
                {result.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OutputPanel;

