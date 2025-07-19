#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Custom script to update README, commit and push changes
 * Usage: npm run update-readme [commit-message]
 * 
 * Examples:
 * npm run update-readme
 * npm run update-readme "feat: add new rating system"
 * npm run update-readme "docs: update API documentation"
 */

function executeCommand(command, description) {
    try {
        console.log(`📋 ${description}...`);
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        if (output.trim()) {
            console.log(output.trim());
        }
        return true;
    } catch (error) {
        console.error(`❌ Error ${description.toLowerCase()}:`, error.message);
        return false;
    }
}

function getProjectStats() {
    let stats = {
        testCount: 'N/A',
        lastUpdated: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    };

    // Try to get current test count
    try {
        const testOutput = execSync('cd backend && npm test -- --passWithNoTests --silent 2>/dev/null', { encoding: 'utf8' });
        const testMatch = testOutput.match(/Tests:\s+(\d+)\s+passed/);
        if (testMatch) {
            stats.testCount = `${testMatch[1]} passing tests`;
        }
    } catch (error) {
        console.log('⚠️  Could not get test count automatically');
    }

    return stats;
}

function main() {
    console.log('🚀 Starting README update, commit, and push process...\n');

    // Get custom commit message from command line args
    const customMessage = process.argv.slice(2).join(' ');
    const commitMessage = customMessage || 'docs: update README';

    // Get project statistics
    const stats = getProjectStats();
    console.log(`📊 Project stats: ${stats.testCount}, updated ${stats.lastUpdated}`);

    // Check if there are changes to commit
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (!status.trim()) {
            console.log('✅ No changes to commit. Everything is up to date!');
            return;
        }
        console.log('📝 Found changes to commit');
    } catch (error) {
        console.error('❌ Error checking git status:', error.message);
        process.exit(1);
    }

    // Add all changes (you can modify this to be more specific)
    if (!executeCommand('git add .', 'Adding changes to git')) {
        process.exit(1);
    }

    // Commit changes
    const commitCmd = `git commit -m "${commitMessage}"`;
    if (!executeCommand(commitCmd, 'Committing changes')) {
        process.exit(1);
    }

    // Push changes
    if (!executeCommand('git push', 'Pushing to remote repository')) {
        process.exit(1);
    }

    console.log('\n🎉 Successfully committed and pushed changes!');
    console.log(`📝 Commit message: "${commitMessage}"`);
    console.log('🔗 Check your repository for the updates');
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { getProjectStats, executeCommand };