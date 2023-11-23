async function processFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please choose a file!');
        return;
    }

    const pmfData = await file.arrayBuffer();
    
    // Define the signature and header
    const pmfHeader = new Uint8Array([
        0x50, 0x6D, 0x66, 0x46, 0x69, 0x6C, 0x65, 0x5F, 
        0x5F, 0x5F, 0x5F, 0x5F, 0x5F, 0x5F, 0x5F, 0x00, 
        0x01, 0x00, 0x00, 0x00, 0x30, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    const originalFilesSignature = new TextEncoder().encode('OriginalFiles__');

    // Check the header
    const pmfHeaderView = new Uint8Array(pmfData, 0, pmfHeader.length);
    if (!arraysEqual(pmfHeader, pmfHeaderView)) {
        alert('Invalid PMF-header!');
        return;
    }
    
    console.log('found valid PMF header!');

    const zip = new JSZip();
    let cursor = pmfHeader.length;

    while (cursor < pmfData.byteLength) {
        // Find next 'OriginalFiles__' position
        const originalFilesPosition = indexOfSequence(
            new Uint8Array(pmfData, cursor), 
            originalFilesSignature
        );

        if (originalFilesPosition === -1) break;

        cursor += originalFilesPosition + originalFilesSignature.length;

        cursor += 33; // Skip 33 unidentified bytes
        
        const filePathView = new Uint8Array(pmfData, cursor, 256);
        const filePathString = new TextDecoder('iso-8859-1').decode(filePathView).replace(/\0/g, '').trim();
        console.log('File path:', filePathString);
        cursor += 256;

        const fileNameFromPath = filePathString.split(/[/\\]/).pop();
        console.log('Filename from path:', fileNameFromPath);

        cursor += 272; // Skip file name (256 bytes) and 16 bytes of unknown data

        const fileSize = new DataView(pmfData, cursor, 6).getUint32(0, true);
        cursor += 6 + 38; // Skip file size and 38 unknown bytes

        const fileData = pmfData.slice(cursor, cursor + fileSize);
        cursor += fileSize;
        
        zip.file(fileNameFromPath, fileData);
        console.log('Extracted filesize:', fileSize);
    }
    
    const outputFileName = file.name.replace(/\.pmf$/i, '.zip');

    zip.generateAsync({ type: "blob" }).then(function(content) {
        saveAs(content, outputFileName);
        document.getElementById('status').textContent = `Success! ${file.name} has been processed.`;
    });
}

function arraysEqual(a, b) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

function indexOfSequence(buffer, seq) {
    outer: for (let i = 0; i < buffer.length - seq.length + 1; i++) {
        for (let j = 0; j < seq.length; j++) {
            if (buffer[i + j] !== seq[j]) continue outer;
        }
        return i;
    }
    return -1;
}
