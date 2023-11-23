# PMF Attachment Extractor Script

This script was created when I encountered a `.pmf` file, reportedly an export from some email system.
Without any information about its structure, I analyzed the binary data and deduced enough to extract attachments - which was my goal.

The script can be useful if you come across a `.pmf` file with the following characteristics:
- Starts with the header "PmfFile________"
- Contains one or more "OriginalFiles__" entries

It's a simple, browser-based JavaScript solution to extract attachments from such PMF files. The script processes the file locally in your browser and generates a `.zip` file with the extracted contents.
The code was not tested on a lot of PMF files (I don't have many) and contains no proper error handling.