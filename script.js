const wordsReel = document.getElementById('wordsReel');

var short = [];
var medium = [];
var long = [];

var characters = [];
var curr_index = 0;
var curr_char = "";

const loadedLists = new Event('loadedWordLists');
var ready = false;

// Having loaded the word lists, call function to handle further proceedings
document.addEventListener('loadedWordLists', finishedLoading, false);

// Keypress listener
document.addEventListener("keydown", ({key}) => {
    if (!ready) {
        return;
    }
    if (key === curr_char.innerText) {
        curr_char.classList.add('correct')
        curr_index++;
        curr_char = characters[curr_index]
    }
})

async function getWordList(length) {
    return fetch(`${length}.txt`).then(response => response.text());
}

async function loadLists() {
    console.log("Loading...")
    short = (await getWordList('short')).split('\n');
    medium = (await getWordList('medium')).split('\n');
    long = (await getWordList('long')).split('\n');
    document.dispatchEvent(loadedLists);   
}

async function finishedLoading() {
    console.log("Loaded");
    characters = await genInitReel();
    curr_char = characters[0];
    console.log("Ready")
    ready = true;
    
}
async function genInitReel() {
    wordsReel.value = null;
    //console.log(words[Math.floor(Math.random() * words.length]);

    var init_block = "";
    for(let i = 0; i < 100; i++) {
        let num = Math.floor(Math.random() * 11);
        //console.log(num);
        if (num <= 0.5) {
            init_block += long[Math.floor(Math.random() * long.length)] + " ";
            //console.log("long added");
        }
        else if (num <= 3) {
            init_block += medium[Math.floor(Math.random() * medium.length)] + " ";
            //console.log("medium added");
        }
        else {
            init_block += short[Math.floor(Math.random() * short.length)] + " ";
            //console.log("short added");
        }
    }
    init_block = init_block.substring(0, init_block.length - 1);
    init_block = init_block.split('').map((char) => {
        const char_span = document.createElement('span');
        char_span.innerText = char;
        wordsReel.appendChild(char_span);
        return char_span;
    });
    return init_block;
}

loadLists();