/**
 * GrokBot Diagnostic Tool
 * 
 * This script helps diagnose and fix common issues with GrokBot setup.
 * It checks for API keys, required files, and dependencies.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Utility to check if a file or directory exists
const exists = (path) => {
    try {
        return fs.existsSync(path);
    } catch (error) {
        return false;
    }
};

// Print formatted headers
const printHeader = (text) => {
    console.log('\n' + chalk.blue('='.repeat(50)));
    console.log(chalk.blue.bold(text));
    console.log(chalk.blue('='.repeat(50)));
};

// Print result with appropriate color
const printResult = (test, result, details = '') => {
    const icon = result ? '✅' : '❌';
    const color = result ? chalk.green : chalk.red;
    
    console.log(`${icon} ${test}: ${color(result ? 'PASS' : 'FAIL')} ${details ? `(${details})` : ''}`);
    return result;
};

// Perform API key checks
const checkApiKeys = () => {
    printHeader('API Configuration Check');
    
    let success = true;
    
    // Check for Grok API key if using Grok
    if (process.env.XAI_API_KEY) {
        printResult('Grok API Key (XAI_API_KEY)', true, 'Found in .env file');
    } else {
        success = false;
        printResult('Grok API Key (XAI_API_KEY)', false, 'Not found in .env file');
        console.log(chalk.yellow('  → Add XAI_API_KEY=your_key_here to your .env file'));
    }
    
    // Check for OpenAI API key if using GPT
    if (process.env.OPENAI_API_KEY) {
        printResult('OpenAI API Key', true, 'Found in .env file');
    } else {
        console.log(chalk.yellow('  ℹ️ No OpenAI API key found. Only needed if using GPT models.'));
    }
    
    return success;
};

// Check for required directories and files
const checkRequiredFiles = () => {
    printHeader('Required Files and Directories Check');
    
    let success = true;
    
    // Check for profiles directory
    const profilesDir = path.join(process.cwd(), 'profiles');
    const profilesExist = exists(profilesDir);
    success = printResult('Profiles Directory', profilesExist) && success;
    
    // Check for src directory
    const srcDir = path.join(process.cwd(), 'src');
    const srcExist = exists(srcDir);
    success = printResult('Source Directory', srcExist) && success;
    
    // Check for specific key files
    const startFile = path.join(process.cwd(), 'start-grokbot.js');
    success = printResult('Start Script', exists(startFile)) && success;
    
    const managerFile = path.join(process.cwd(), 'grokbot-manager.js');
    success = printResult('Manager Script', exists(managerFile)) && success;
    
    // Check for profiles
    const grokProfile = path.join(profilesDir, 'grok.json');
    if (exists(grokProfile)) {
        printResult('Grok Profile', true);
    } else {
        success = false;
        printResult('Grok Profile', false);
        console.log(chalk.yellow('  → Profile is missing. Check profiles directory.'));
    }
    
    return success;
};

// Check memory system
const checkMemorySystem = () => {
    printHeader('Memory System Check');
    
    let success = true;
    
    // Check if memory dirs exist
    const botDir = path.join(process.cwd(), 'bots');
    if (!exists(botDir)) {
        try {
            fs.mkdirSync(botDir, { recursive: true });
            printResult('Created Bots Directory', true);
        } catch (error) {
            success = false;
            printResult('Create Bots Directory', false, error.message);
        }
    } else {
        printResult('Bots Directory', true, 'Already exists');
    }
    
    // Check for GrokBot memory directory
    const grokbotDir = path.join(botDir, 'GrokBot');
    if (!exists(grokbotDir)) {
        try {
            fs.mkdirSync(grokbotDir, { recursive: true });
            printResult('Created GrokBot Memory Directory', true);
        } catch (error) {
            success = false;
            printResult('Create GrokBot Memory Directory', false, error.message);
        }
    } else {
        printResult('GrokBot Memory Directory', true, 'Already exists');
    }
    
    // Check for write permissions
    try {
        const testFile = path.join(grokbotDir, 'test_write.tmp');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        printResult('Memory Directory Write Access', true);
    } catch (error) {
        success = false;
        printResult('Memory Directory Write Access', false, error.message);
    }
    
    return success;
};

// Check for required dependencies
const checkDependencies = () => {
    printHeader('Dependencies Check');
    
    let success = true;
    
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredDeps = [
            'mineflayer',
            'mineflayer-pathfinder',
            'dotenv',
        ];
        
        for (const dep of requiredDeps) {
            if (pkg.dependencies[dep]) {
                printResult(dep, true, pkg.dependencies[dep]);
            } else {
                success = false;
                printResult(dep, false, 'Missing from package.json');
            }
        }
    } catch (error) {
        success = false;
        printResult('Read package.json', false, error.message);
    }
    
    return success;
};

// Check Minecraft server
const checkMinecraftServer = () => {
    printHeader('Minecraft Server Check');
    
    const host = process.env.MC_SERVER_HOST || '127.0.0.1';
    const port = process.env.MC_SERVER_PORT || '25565';
    
    console.log(`Minecraft Server: ${host}:${port}`);
    console.log(chalk.yellow('Note: Cannot verify if Minecraft server is running. Please ensure your server is online.'));
    
    return true;
};

// Create or update .env file with missing variables
const updateEnvFile = () => {
    printHeader('Environment Configuration');
    
    // Check if .env exists
    if (!exists('.env')) {
        console.log(chalk.yellow('Creating new .env file...'));
        
        const defaultEnv = 
`# GrokBot Configuration
# API Keys
XAI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here

# Minecraft Server
MC_SERVER_HOST=127.0.0.1
MC_SERVER_PORT=25565

# Bot Settings
BOT_USERNAME=GrokBot
BOT_PASSWORD=

# Memory Settings
MEMORY_AUTOSAVE_INTERVAL=60000
MEMORY_BACKUP_FREQUENCY=5

# API Health Settings
API_CHECK_INTERVAL=30000
API_FAILURE_THRESHOLD=5
API_MAX_CONSECUTIVE_ERRORS=10

# Debug Settings
DEBUG_MODE=false
`;
        
        try {
            fs.writeFileSync('.env', defaultEnv);
            printResult('Create .env file', true);
            console.log(chalk.yellow('Please edit the .env file and add your API keys.'));
        } catch (error) {
            printResult('Create .env file', false, error.message);
        }
    } else {
        console.log(chalk.green('.env file already exists.'));
        
        // Check for missing variables and add them
        const envContent = fs.readFileSync('.env', 'utf8');
        let updated = false;
        let newContent = envContent;
        
        const requiredVars = {
            'MEMORY_AUTOSAVE_INTERVAL': '60000',
            'MEMORY_BACKUP_FREQUENCY': '5',
            'API_CHECK_INTERVAL': '30000',
            'API_FAILURE_THRESHOLD': '5',
            'API_MAX_CONSECUTIVE_ERRORS': '10'
        };
        
        for (const [key, value] of Object.entries(requiredVars)) {
            if (!envContent.includes(key + '=')) {
                console.log(chalk.yellow(`Adding missing variable ${key}=${value}`));
                newContent += `\n${key}=${value}`;
                updated = true;
            }
        }
        
        if (updated) {
            try {
                fs.writeFileSync('.env', newContent);
                printResult('Update .env file', true);
            } catch (error) {
                printResult('Update .env file', false, error.message);
            }
        } else {
            printResult('Check .env variables', true, 'All required variables present');
        }
    }
};

// Main diagnostic function
const runDiagnostics = () => {
    printHeader('GrokBot Diagnostic Tool v1.0');
    console.log(`Date: ${new Date().toLocaleString()}`);
    console.log(`Node Version: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    
    // Update environment configuration first
    updateEnvFile();
    
    // Run checks
    const apiSuccess = checkApiKeys();
    const filesSuccess = checkRequiredFiles();
    const memorySuccess = checkMemorySystem();
    const depsSuccess = checkDependencies();
    const serverSuccess = checkMinecraftServer();
    
    // Summary
    printHeader('Diagnostic Summary');
    printResult('API Configuration', apiSuccess);
    printResult('Required Files', filesSuccess);
    printResult('Memory System', memorySuccess);
    printResult('Dependencies', depsSuccess);
    printResult('Server Configuration', serverSuccess);
    
    const overallSuccess = apiSuccess && filesSuccess && memorySuccess && depsSuccess && serverSuccess;
    
    if (overallSuccess) {
        console.log('\n' + chalk.green.bold('✅ All checks passed! GrokBot should be ready to start.'));
        console.log(chalk.green('Run "node grokbot-manager.js" or "start-grokbot-manager.bat" to start GrokBot.'));
    } else {
        console.log('\n' + chalk.yellow.bold('⚠️ Some checks failed. Please fix the issues above before starting GrokBot.'));
    }
    
    return overallSuccess;
};

// Execute diagnostics
runDiagnostics();
