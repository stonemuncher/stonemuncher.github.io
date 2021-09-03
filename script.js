const wordsReel = document.getElementById('wordsReel');

const LETTERS = "abcdefghijklmnopqrstuvwxyz"
var short = [];
var medium = [];
var long = [];

var characters = [];
var curr_index = 0;
var curr_char = "";
const loadedLists = new Event('loadedWordLists');
var ready = false;

var per_line = 0;
var waiting = "";
var last_line = 0;

// Having loaded the word lists, call function to continue
document.addEventListener('loadedWordLists', finished_loading, false);

window.addEventListener('resize', on_resize);

// Keypress listener
document.addEventListener("keydown", async ({key}) => {
    if (!ready) {
        return;
    }
    let curr_line = curr_char.offsetTop;
    if (key === curr_char.innerText) {

        curr_char.classList.add('correct');
        curr_char.classList.remove('cursor');

        if (characters[curr_index+1].offsetTop !== curr_line) {
            curr_line = characters[curr_index+1].offsetTop;

            console.log("Line change");

            if (curr_index > per_line) {
                curr_index -= last_line;

                for (let i = 0; i < last_line; i++) {
                    wordsReel.removeChild(characters[i]);
                }
                
                characters = characters.slice(last_line, characters.length);
                let new_line = await get_line(waiting);
                waiting = new_line[1];

                for (let i = 0; i < new_line[0].length; i++) {
                    const char_span = document.createElement('span');
                    char_span.innerText = new_line[0][i];
                    wordsReel.appendChild(char_span);
                    characters.push(char_span);
                }
            }
            last_line = curr_index;
        }
        curr_char = characters[++curr_index]
        curr_char.classList.add('cursor');
    }

    // else if (!key && curr_index >= )
    else if (LETTERS.includes(key)){
        // Process error and update values for letters
        console.log(`${key} => ${curr_char.innerText}`);
    }
})


async function on_resize() {
    console.log('Resized');
    /*
    ready = false;
    per_line = await chars_per_line();
    ready = true;
    */
}


async function chars_per_line() {
    wordsReel.classList.add('test');
    let i = 0;
    let span = document.createElement('span');
    span.innerText = "a";
    wordsReel.appendChild(span);
    let first = span.offsetTop;
    
    while (span.offsetTop === first) {
        span = document.createElement('span');
        if (i%2 === 0) {
            span.innerText = " ";
        } else {
            span.innerText = "a"
        }
        wordsReel.appendChild(span);
        i++;
    }
    wordsReel.innerHTML = '';
    wordsReel.classList.remove('test');
    console.log(`Characters per line: ${i}`);
    return (i);
}

async function print_curr_line(line_length) {
    let string_out = "";
    for (let i = 0; i < line_length; i++) {
        string_out += characters[i].innerText;
    }
    console.log(string_out);
}

async function get_word_list(length) {
    return fetch(`${length}.txt`).then(response => response.text());
}

async function load_lists() {
    console.log("Loading...")
    short = (await get_word_list('short')).split('\n');
    medium = (await get_word_list('medium')).split('\n');
    long = (await get_word_list('long')).split('\n');
    document.dispatchEvent(loadedLists);   
}

async function finished_loading() {
    console.log("Loaded");
    per_line = await chars_per_line();
    characters = await gen_first_lines();
    curr_char = characters[0];
    curr_char.classList.add('cursor');
    console.log("Ready")
    ready = true;
}

async function get_word() {
    let num = Math.floor(Math.random() * 11);
        let word = "";
        //console.log(num);
        if (num <= 0.5) {
            word = long[Math.floor(Math.random() * long.length)];
            //console.log("long added");
        }
        else if (num <= 3) {
            word = medium[Math.floor(Math.random() * medium.length)];
            //console.log("medium added");
        }
        else {
            word = short[Math.floor(Math.random() * short.length)];
            //console.log("short added");
        }
    return word;
}

async function get_line(start) {

    let line = "";
    let word = await get_word();;
    let done = false;
    if (start) {
        line = start + " ";
    }
    while (!done) {
        //console.log(line);
        if (line.length + word.length + 1 > per_line && line) {
            //console.log(`Word ${word} overran (${line.length + word.length + 1} > ${per_line})`)
            done = true;
        }
        else {
            line += word + " ";
            word = await get_word();
        }
    }
    //console.log(line.length);
    //console.log(per_line-line.length);
    
    return [line, word];
}

async function gen_first_lines() {
    wordsReel.value = null;
    var init_block = "";

    let new_line = await get_line();
    waiting = new_line[1];
    init_block += new_line[0];
    for (let i = 0; i < 2; i++) {
        new_line = await get_line(waiting);
        init_block += new_line[0];
        waiting = new_line[1];
    }

    init_block = init_block.substring(0, init_block.length).split('');
    for (let i = 0; i < init_block.length; i++) {
        const char_span = document.createElement('span');
        char_span.innerText = init_block[i];
        wordsReel.appendChild(char_span);
        init_block[i] = char_span;
    }
    return init_block;
}
load_lists();
