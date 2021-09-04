const wordsReel = document.getElementById('wordsReel');

const LETTERS = "abcdefghijklmnopqrstuvwxyz"

var characters = [];
var curr_index = 0;
var curr_char = "";
const loadedLists = new Event('loadedWordLists');
var ready = false;

var per_line = 0;
var waiting = "";
var last_line = 0;

var word_list = {};
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
    var short = (await get_word_list('short')).split('\n');
    var medium = (await get_word_list('medium')).split('\n');
    var long = (await get_word_list('long')).split('\n');
    word_list["short"] = short;
    word_list["medium"] = medium;
    word_list["long"] = long;
    for (const letter of LETTERS) {
        word_list[letter] = {};
        word_list[letter]['short'] = short.filter(word => word.includes(letter));
        word_list[letter]['medium'] = medium.filter(word => word.includes(letter));
        word_list[letter]['long'] = long.filter(word => word.includes(letter));
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
    word_length = "long";
    if (!required) {
        word = word_list[word_length][Math.floor(Math.random() * word_list[word_length].length)]
    } 
    else {
        let shortest = {"length": undefined, "letter":""};
        required.forEach(letter => {
            if ((word_list[letter][word_length].length < shortest["length"]) || !shortest["length"]) {
                shortest["length"] = word_list[letter][word_length].length;
                shortest["letter"] = letter;
            }
        });
        console.log(shortest);
        const possible = word_list[shortest["letter"]][word_length].filter(word => {
            let add = true;
            required.forEach(letter => {
                if (!word.includes(letter)) {
                    add = false;
                }
            })
            return add;
        });
        if (possible.length) {
            word = possible[Math.floor(Math.random() * possible.length)];
        }
        else {
            alert("none");
        }
       
    }
    const end = performance.now();
    const time = end - start;
    console.log(word + ' ' + time);
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
