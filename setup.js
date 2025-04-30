const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// This setup script simply creates a `content` folder 
// and a `site.config.json` file for you to start with.



// Duplicate folder "sample-content" to "content" by executing a shell command
const sampleContentDir = 'sample-content';
const targetContentDir = 'content';
if (!fs.existsSync(targetContentDir)) {
    try {
        execSync(`cp -r ${sampleContentDir} ${targetContentDir}`);
        console.log("✅ `content` folder created from `sample-content`. Use this folder to add your own content.");
    } catch (error) {
        console.error("❌ Error creating `content` folder:", error.message);
    }
}

// Create site.config.json file
const sampleConfigPath = 'sample-site.config.json';
const targetConfigPath = 'site.config.json';

if (!fs.existsSync(targetConfigPath)) {
    let config = JSON.parse(fs.readFileSync(sampleConfigPath, 'utf-8'));

    // Update the folder paths to remove "sample-" prefix
    const remappedDirs = {};
    for (const [key, value] of Object.entries(config.dirs || {})) {
        remappedDirs[key] = value.replace(/^sample-/, '');
    }

    config.dirs = remappedDirs;

    // Write updated config
    fs.writeFileSync(targetConfigPath, JSON.stringify(config, null, 2));
    console.log("✅ `site.config.json` created -- edit this to configure your site.");

} else {
    console.log("⚠️  `site.config.json` already exists -- edit this to configure your site.");
}