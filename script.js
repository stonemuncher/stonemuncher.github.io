const wordsReel = document.getElementById('wordsReel');
const pausedMsg = document.getElementById('paused');
const info = document.getElementById('values');

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

var user_values = {};
var characters = [];
var curr_index = 0;
var curr_char = "";
const loadedLists = new Event('loadedWordLists');

var ready = false;
var paused = true;
pausedMsg.innerText = "To start, just start typing!";

var per_line = 0;
var waiting = "";
var last_line = 0;

var last_time = 0;
var word_list = {};

// Having loaded the word lists, call function to continue
document.addEventListener('loadedWordLists', finished_loading, false);

window.addEventListener('resize', on_resize);

window.onunload = save_values;

// Keypress listener
document.addEventListener("keydown", async ({key}) => {
    console.clear();
    if (!ready) {
        return;
    }
    if (key == "Enter") {
        paused = true;
        pausedMsg.innerText = "Paused";
    }
    let curr_line = curr_char.offsetTop;
    if (key === curr_char.innerText) {
        if (paused) {
            paused = false;
            last_time = performance.now();
            pausedMsg.innerText = "";
        }
        else if (key in user_values) {
            const time_delta = performance.now() - last_time;
            last_time = performance.now();
            let val = await sigmoid(time_delta/800)
            info.innerText =  val + " " + time_delta;
            user_values[key.toLowerCase()] *= 0.4 + val;
        }

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

        priner = []
        for(const key in user_values) {
            priner.push([key, user_values[key]]);
        }

        priner.sort(function(a, b) {
            if(a[1] === b[1]) {
                return 0;
            }
            else {
                return (a[1] < b[1]) ? -1: 1;
            }
        });
        priner.reverse();
        priner = priner.slice(0, 5);
        for (const item of priner) {
            console.log(item[0] + " " + item[1]);
        }
        
    }

    // else if (!key && curr_index >= )
    else if (LETTERS.includes(key)){

        // Process error and update values for letters
        // console.log(`${key} => ${curr_char.innerText}`);
    }
})

async function sigmoid(x) {
    return 1/(1+2.71828**(-x))
}

async function on_resize() {
    console.log('Resized');
    /*
    ready = false;
    per_line = await chars_per_line();
    ready = true;
    */
}

async function save_values() {
    for(letter of LETTERS) {
        if (localStorage.getItem(letter)) {
            localStorage.setItem(letter, user_values[letter]);
        }
    }
}
async function load_values() {
    for(letter of LETTERS) {
        if (localStorage.getItem(letter)) {
            user_values[letter] = localStorage.getItem(letter);
        }
        else {
            user_values[letter] = 1;
        }
    }
}

async function chars_per_line() {
    wordsReel.classList.add('hidden');
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
    wordsReel.classList.remove('hidden');
    console.log(`Characters per line: ${i}`);
    return (i);
}

async function print_curr_line(line_length) {
    let string_out = "";
    for (let i = 0; i < line_length; i++) {
        string_out += characters[i].innerText;
    }
    //console.log(string_out);
}

async function get_word_list(length) {
    return fetch(`${length}.txt`).then(response => response.text());
}

async function load_lists() {
    console.log("Loading...")
    var short = (await get_word_list('short')).split('\n');
    var medium = (await get_word_list('medium')).split('\n');
    var long = (await get_word_list('long')).split('\n');
    word_list["short"] = short;
    word_list["medium"] = medium;
    word_list["long"] = long;

    test_saved = localStorage.getItem('a');
    if (test_saved) {
        await load_values();
        console.log("Loaded localstorage objects")
    }
    for (const letter of LETTERS) {
        word_list[letter] = {};
        word_list[letter]['short'] = short.filter(word => word.includes(letter));
        word_list[letter]['medium'] = medium.filter(word => word.includes(letter));
        word_list[letter]['long'] = long.filter(word => word.includes(letter));

        if(!test_saved) {
            user_values[letter] = 1
        }
    }

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

async function get_word(required) {
    const start = performance.now();
    let word = "";
    let word_length = "";
    const num = Math.floor(Math.random() * 11);
    //console.log(num);
    if (num <= 0.5) {
        word_length = "long";
    }
    else if (num <= 3) {
        word_length = "medium";
    }
    else {
        word_length = "short";
    }
    if (!required) {
        word = word_list[word_length][Math.floor(Math.random() * word_list[word_length].length)]
    } 
    else {
        if (required.length === 1) {
            const possible = word_list[required[0]][word_length];
            word = possible[Math.floor(Math.random() * possible.length)];
        } else {
            let shortest = {"length": undefined, "letter":""};
            required.forEach(letter => {
                if ((word_list[letter][word_length].length < shortest["length"]) || !shortest["length"]) {
                    shortest["length"] = word_list[letter][word_length].length;
                    shortest["letter"] = letter;
                }
            });

            let condition = '^'

            required = required.filter(letter => letter !== shortest["letter"]);
            required.forEach(letter => {
                condition += `(?=.*${letter})`;
            });
            condition = new RegExp(condition);

            const possible = word_list[shortest["letter"]][word_length].filter(word => condition.test(word));
            if (possible.length) {
                word = possible[Math.floor(Math.random() * possible.length)];
            }
            else {
                // Handle the fact there are no words with the given requirements and word length
                alert("none");
            }   
        }
    }
    const end = performance.now();
    const time = end - start;
    //console.log(word + ' ' + time);
    return word;
}

async function get_line(start) {
    let required = undefined;
    let line = "";
    let word = await get_word(required);;
    let done = false;
    if (start) {
        line = start + " ";
    }
    while (!done) {
        if (line.length + word.length + 1 > per_line && line) {
            done = true;
        }
        else {
            line += word + " ";
            word = await get_word(required);
        }
    }
    
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
