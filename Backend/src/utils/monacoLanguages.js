const JUDGE0_TO_MONACO = {
    // C
    48: 'c',
    49: 'c',
    50: 'c',
    75: 'c',

    // C++
    52: 'cpp',
    53: 'cpp',
    54: 'cpp',
    76: 'cpp',

    // Java
    62: 'java',
    91: 'java',

    // Python
    70: 'python',
    71: 'python',
    92: 'python',

    // JavaScript & TypeScript
    63: 'javascript',
    93: 'javascript',
    74: 'typescript',
    94: 'typescript',

    // C#
    51: 'csharp',

    // Go
    60: 'go',
    95: 'go',

    // Rust
    73: 'rust',

    // Kotlin
    78: 'kotlin',

    // Swift
    83: 'swift',

    // Ruby
    72: 'ruby',

    // PHP
    68: 'php',

    // SQL
    82: 'sql',

    // Bash / Shell
    46: 'shell'
};


const getMonacoLanguage = (judge0Id) => {
    return JUDGE0_TO_MONACO[judge0Id] || 'plaintext';
};

module.exports = { getMonacoLanguage };