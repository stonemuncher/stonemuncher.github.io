const wordsReel = document.getElementById('wordsReel');
const pausedMsg = document.getElementById('paused');
const info = document.getElementById('typed');

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

// Number of words that the user can type before the algorithm starts to adaptively add words to the word-reel
const GRACE_WORDS = 100;

// Chance of a newly added word having to contain difficult letters
var chance_required = 0.5;

// Key difficulties
var user_values = {};

// History of Overall values (Summed/total key difficulties)
var totals_history = [];

var words_typed = 0;
var worst_five = [];

// Used in the word-reel
var characters = [];
var curr_index = 0;
var curr_char = "";

// Event broadcast once the word list files have been loaded
const loadedLists = new Event('loadedWordLists');


var ready = false;
var paused = true;
info.innerText = "To start, just start typing!";

var per_line = 0;
var waiting = "";
var last_line = 0;

var last_time = 0;
var word_list = {};

// Having loaded the word lists, call function to continue
document.addEventListener('loadedWordLists', finished_loading, false);

window.onunload = save_values;

// Keypress listener
document.addEventListener("keydown", async ({ key }) => {

        if (!ready) {
                return;
        }
        
        // Logic to pause the app
        if (key == "Enter") {
                paused = true;
                info.innerText = "Paused";
        }
        let curr_line = curr_char.offsetTop;

        // If the key inputted was the correct key in sequence
        if (key === curr_char.innerText) {

                // If paused, this means the user has started typing again
                // last_time is updated to start timing for the time_delta for the next key
                if (paused) {
                        paused = false;
                        last_time = performance.now();
                        info.innerText = words_typed;
                }

                // If the key inputted was not a space and was a key that has its difficulty tracked
                // within the user_values dictionary
                else if (key in user_values && key != " ") {
                        const time_delta = performance.now() - last_time;
                        last_time = performance.now();

                        // New value generated to be used to modify key difficulty
                        let val = await sigmoid(time_delta / 800);
                        info.innerText = words_typed;

                        // Modify key difficulty
                        user_values[key.toLowerCase()] *= 0.4 + val;

                // This means the input was a space and in the correct place, hence a word was typed
                } else {
                        words_typed += 1;

                        // Words_typed in the localStorage is updated in case of shutdown, to keep a 
                        // correct count.
                        localStorage.setItem("typed", words_typed);

                        // Every 10 words, assuming the words_typed is above the grace period, the Overall score
                        // (summed key difficulties) is calculated and added to the array (totals_history) and saved to localStorage
                        if (words_typed % 10 == 0 && words_typed >= GRACE_WORDS) {
                                let total = get_total();
                                totals_history.push(total.toFixed(3));
                                localStorage.setItem("history", JSON.stringify(totals_history));
                        }
                }

                // Change visuals to move cursor on and make character viewed as correct (style.css)
                curr_char.classList.remove("incorrect");
                curr_char.classList.add('correct');
                curr_char.classList.remove('cursor');

                // Detects for a line change
                if (characters[curr_index + 1].offsetTop !== curr_line) {
                        curr_line = characters[curr_index + 1].offsetTop;
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

                values = []
                for (const key in user_values) {
                        values.push([key, user_values[key]]);
                }
         
                // Using the user_values, recalculate the worst_five letters 
                // i.e. the 5 letters with the highest difficulty values
                values = reverse_merge(values);
                worst_five = values.slice(0, 5);
            
        }
        // If the key was incorrect, the key difficulty is increased by a flat 0.2
        else if (LETTERS.includes(key) && curr_char.innerText != " ") {
                user_values[curr_char.innerText] += 0.2;
                curr_char.classList.add("incorrect");
        }
})

// Sigmoid function (view documentation)
async function sigmoid(x) {
        return 1 / (1 + 2.71828 ** (-x))
}

// Called upon closing of the page, saves the number of words typed along with the new user_values
async function save_values() {
        localStorage.setItem("typed", words_typed);
        for (const letter of LETTERS) {
                localStorage.setItem(letter, user_values[letter]);
        }
}

// Called upon loading of the page, checks if entries exist within localStorage
// If they do, the variable default values are overwritten using the stored value
async function load_values() {
        if (localStorage.getItem("chancerequired")) {
                chance_required = Number(localStorage.getItem("chancerequired"))/100;
        }
        if (localStorage.getItem("history")) {
                totals_history = JSON.parse(localStorage.getItem("history"));
        } else {
                localStorage.setItem("history", JSON.stringify(totals_history));
        }
        if (localStorage.getItem("typed")) {
                words_typed = Number(localStorage.getItem("typed"));
        }
        for (letter of LETTERS) {
                if (localStorage.getItem(letter)) {
                        user_values[letter] = Number(localStorage.getItem(letter));
                }
                else {
                        user_values[letter] = 0.5;
                }
        }
        values = []
        for (const key in user_values) {
                values.push([key, user_values[key]]);
        }

        values = reverse_merge(values);
        worst_five = values.slice(0, 5);
}

/* Used to calculate the number of characters per line on a users screen
   Since the font size is fixed, the number of characters per line is important and must be accurate
   so that the word-reel stays at a fixed 3 lines. It works by filling lines and working out when they 
   wrap - this is only possible since the font is the same width for every letter (monotype)
*/
async function chars_per_line() {
        wordsReel.classList.add('hidden');
        let i = 0;
        let span = document.createElement('span');
        span.innerText = "a";
        wordsReel.appendChild(span);
        let first = span.offsetTop;

        while (span.offsetTop === first) {
                span = document.createElement('span');
                if (i % 2 === 0) {
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

// Helper loading function
async function get_word_list(length) {
        return fetch(`${length}.txt`).then(response => response.text());
}

// Used to load the word lists and partition them for rapid searching
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

                if (!test_saved) {
                        user_values[letter] = Number(0.5);
                }
        }

        document.dispatchEvent(loadedLists);
}

// Once necessaries are loaded, certain calls (self-explanatory) are required
// before ready=true and the user can start typing.
async function finished_loading() {
        console.log("Loaded");
        per_line = await chars_per_line();
        characters = await gen_first_lines();
        curr_char = characters[0];
        curr_char.classList.add('cursor');
        console.log("Ready")
        ready = true;
}

// Get word function takes a paramter referring to the number of letters, from the 
// 5 highest difficulty letters, the word to be chosen should ideally have. This is used
// when a call to get_word results in a failure to find a word with the requirements, and is 
// decremented each recursive call until the requirement is a single letter and there is a 100%
// chance of the word being found.
async function get_word(attempt_unknowns) {

        if (!attempt_unknowns) {
                let x = Math.random();
                if (x > chance_required) {
                        attempt_unknowns = 0;
                } else {
                        attempt_unknowns = 5;
                }
        }
        let shuffled = [];
        let required = [];
        if (attempt_unknowns) {
                shuffled = worst_five.sort(() => 0.5 - Math.random());
        }
        if (words_typed > GRACE_WORDS && ready) {
                for (let i = 0; i < attempt_unknowns; i++) {
                        required.push(shuffled[i][0]);
                }
        }

        const start = performance.now();
        let word = "";
        let word_length = "";
        const num = Math.floor(Math.random() * 11);
        if (num <= 0.5) {
                word_length = "long";
        }
        else if (num <= 3) {
                word_length = "medium";
        }
        else {
                word_length = "short";
        }
        // If there are no requirements, choose a random word of the given length
        if (!required || required.length == 0) {
                word = word_list[word_length][Math.floor(Math.random() * word_list[word_length].length)]
        }
        else {
                if (required.length === 1) {
                        const possible = word_list[required[0]][word_length];
                        word = possible[Math.floor(Math.random() * possible.length)];
                } else {
                      
                        // Optimisation using regex discussed in write-up
                        let shortest = { "length": undefined, "letter": "" };
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
                                // Change the number of required letters from the 5 and reduce it by one
                                return get_word(required.length);
                      
                        }
                }
        }
        const end = performance.now();
        const time = end - start;
        return word;
}

// Helper function to get an Overall score (sum of key difficulties)
function get_total() {
        total = 0
        for (const key in user_values) {
                total += user_values[key];
        }
        return total;
}

// Generate a new line. This takes a word that is the start of the line, which is 
// generated in the previous call to the function. This is a requirement so that 
// the line count stays fixed at 3, and there is no wrapping.
async function get_line(start) {
        let word;
        word = await get_word();
        let line = "";
        let done = false;
        if (start) {
                line = start + " ";
        }
        while (!done) {
                required = [];
                if (line.length + word.length > per_line && line) {
                        done = true;
                }
                else {
                        line += word + " ";
                        word = await get_word();
                }
        }

        // The line, and the 'waiting' word to be included as the start of the next line.
        return [line, word];
}

// Generate the initial block of lines
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

// Start loading, after this the respective functions are ready to start running the trainer.
load_lists();
