#! /usr/bin/env node
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const degit = require("degit");

function cloneRepo(foldername) {
  return new Promise((resolve) => {
    console.log("Started cloning the mithril-app repo!");
    const emitter = degit("erikvullings/mithril-app", {
      cache: false,
      force: true,
      verbose: true,
    });

    emitter.on("info", (info) => {
      console.log(info.message);
    });

    emitter.clone(foldername).then(() => {
      console.log("done");
      resolve();
    });
  });
}

async function replaceWordsInFiles(folderPath, dictionary) {
  return new Promise((resolve) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error("Error reading folder:", err);
        return;
      }

      files.forEach((file) => {
        const filePath = path.join(folderPath, file);
        fs.stat(filePath, async (err, stats) => {
          if (err) {
            console.error("Error getting file stats:", err);
            return;
          }
          if (
            stats.isFile() &&
            (file.endsWith(".ts") || file.endsWith(".json"))
          ) {
            fs.readFile(filePath, "utf8", (err, data) => {
              if (err) {
                console.error("Error reading file:", err);
                return;
              }

              // Replace words in the file content using the dictionary
              let replacedContent = data;
              for (const [key, value] of dictionary.entries()) {
                const regex = new RegExp("\\b" + key + "\\b", "g"); // word boundary
                replacedContent = replacedContent.replace(regex, value);
              }

              // Write the modified content back to the file
              if (data !== replacedContent) {
                fs.writeFile(filePath, replacedContent, "utf8", (err) => {
                  if (err) {
                    console.error("Error writing file:", err);
                  } else {
                    console.log(`Words replaced in file: ${filePath}`);
                  }
                });
              }
            });
          } else if (stats.isDirectory()) {
            // Recursively process subfolders
            await replaceWordsInFiles(filePath, dictionary);
          }
        });
      });
      resolve();
    });
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function promptUser(question, defaultValue) {
  return new Promise((resolve) => {
    rl.question(`${question} (${defaultValue}): `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function main() {
  console.log("Welcome to the Mithril App Generator!\n");

  const projectName = await promptUser(
    "Enter project (folder) name",
    "create-mithril-app"
  );
  const applicationTitle = await promptUser(
    "Enter application title",
    projectName
  );
  const applicationShortTitle = await promptUser(
    "Enter application short title",
    applicationTitle
  );
  const applicationDesc = await promptUser("Enter application desciption", "");
  const applicationPort = await promptUser("Enter webdev port", "1234");

  console.log("\nGenerating Mithril app with the following details:");
  console.log(`Project Name: ${projectName}`);
  console.log(`Application Title: ${applicationTitle}`);
  console.log(`Application Short Title: ${applicationShortTitle}`);
  console.log(`Application Port: ${applicationPort}`);
  console.log(`Application Description: ${applicationDesc}`);

  await cloneRepo(projectName);

  const dictionary = new Map([
    ["MITHRIL-APP-SHORT", JSON.stringify(applicationShortTitle)],
    ["MITHRIL-APP", JSON.stringify(applicationTitle)],
    ["mithril-app", applicationTitle.replace(/['":;]/g, "_").toLowerCase()],
    ["APPLICATION_DESCRIPTION", JSON.stringify(applicationDesc)],
    ["erikvullings", JSON.stringify(applicationDesc)],
    ["65533", applicationPort],
  ]);

  await replaceWordsInFiles(projectName, dictionary);
  // Here you can write the logic to generate the Mithril app with the provided details
  // For demonstration purposes, let's just log a success message
  console.log("\nMithril app generated successfully!");

  rl.close();
}

main();
