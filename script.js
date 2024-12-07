document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchText");
    const searchButton = document.getElementById("searchButton");
    const outputDiv = document.getElementById("output");

    let parsedScript = [];
    let musicMap = {};

    // Function to decode ROT47
    function rot47(text) {
        return text.replace(
            /[\x21-\x7E]/g,
            char => String.fromCharCode(33 + ((char.charCodeAt(0) - 33 + 47) % 94))
        );
    }

    // Load the music definitions from JSON
    fetch('music_entries.json')
        .then(response => response.json())
        .then(musicEntries => {
            musicMap = musicEntries.reduce((map, entry) => {
                const id = entry.fname_loop.split('/').pop().replace('.ogg', '');
                map[id] = `${entry.name} - ${entry.artist}`;
                return map;
            }, {});
            console.log("Music map loaded:", musicMap);
        })
        .catch(error => console.error("Error loading music entries:", error));

    // Load the encrypted script and decode it
    fetch('script.seki')
        .then(response => response.text())
        .then(encryptedContent => {
            const scriptContent = rot47(encryptedContent);
            parsedScript = parseScript(scriptContent);
            searchInput.disabled = false;
            searchButton.disabled = false;
            outputDiv.textContent = "Script loaded.\nType some text from The Sekimeiya: Spun Glass to find the song that plays at that moment.";
        })
        .catch(error => console.error("Error loading script:", error));

    searchButton.addEventListener("click", () => {
        const searchText = searchInput.value.trim();
        if (!searchText) {
            outputDiv.textContent = "Please enter text to search.";
            return;
        }
        const result = searchScript(parsedScript, searchText);
        outputDiv.textContent = result.length > 0 ? result.join("\n") : "No matches found.";
    });

    function parseScript(content) {
        const lines = content.split("\n");
        const parsed = [];
        let currentSong = "No BGM";
    
        lines.forEach((line) => {
            line = line.trim();
    
            // Ignore text tags like {w}
            line = line.replace(/\{[^}]*\}/g, "");
    
            // Updated regex to handle additional parameters like fadein=3
            const playMusicMatch = line.match(/^\$ PlayMusic\(\s*"([^"]+)"(?:\s*,[^)]*)?\)/);
            if (playMusicMatch) {
                const songId = playMusicMatch[1];
                currentSong = musicMap[songId] || songId; // Map the song ID to its full name
            } else if (line.startsWith("$ StopMusic")) {
                currentSong = "No BGM";
            } else if (!line.startsWith("$") && !line.startsWith("#") && line.includes("\"") && line) {
                parsed.push({ text: line, song: currentSong });
            }
        });
    
        return parsed;
    }

    function searchScript(script, searchText) {
        const lowerSearchText = searchText.toLowerCase();
        const matchingSongs = new Set();
    
        script.forEach(entry => {
            if (entry.text.toLowerCase().includes(lowerSearchText)) {
                matchingSongs.add(entry.song); // Add the song to a Set to ensure uniqueness
            }
        });
    
        return Array.from(matchingSongs)
          .filter(song => song.toLowerCase() === lowerSearchText) // case-insensitive comparison
          .map(song => `Song: ${song}`);
    
    }

});
