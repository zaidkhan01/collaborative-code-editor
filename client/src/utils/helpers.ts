export const LANGUAGE_CONFIGS = {
  javascript: {
    name: 'JavaScript',
    monacoLanguage: 'javascript',
    extension: 'js',
    defaultCode: '// JavaScript\nconsole.log("Hello, World!");'
  },
  python: {
    name: 'Python',
    monacoLanguage: 'python',
    extension: 'py',
    defaultCode: '# Python\nprint("Hello, World!")'
  },
  java: {
    name: 'Java',
    monacoLanguage: 'java',
    extension: 'java',
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
  },
  cpp: {
    name: 'C++',
    monacoLanguage: 'cpp',
    extension: 'cpp',
    defaultCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`
  },
  go: {
    name: 'Go',
    monacoLanguage: 'go',
    extension: 'go',
    defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`
  }
};

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9'
];

export const getRandomColor = (): string => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

