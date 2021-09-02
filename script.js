const wordsDisplayElement = document.getElementById('wordsDisplay');
const wordsInputElement = document.getElementById('wordsInput');

var short = [];
var medium = [];
var long = [];
const loadedLists = new Event('loadedWordLists');
document.addEventListener('loadedWordLists', function (e) {genBlock()}, false);



wordsInputElement.readOnly = "true";
wordsInputElement.addEventListener('input', () => {

    const correct_letters = wordsDisplayElement.querySelectorAll('span');
    const typed_letters = wordsInputElement.value.split('');

    let correct = true;
    var current = "not_set";
    correct_letters.forEach((char_span, index) => {
        const typed_char = typed_letters[index];
        let offsets = char_span.getBoundingClientRect();
        console.log(offsets.top);
        if (typed_char == null) {
            if (current === "not_set") {
                current = index-1;
            }
            char_span.classList.remove('incorrect');
            char_span.classList.remove('correct');
            correct = false;
        }
        else if (typed_char === char_span.innerText) {
            char_span.classList.remove('incorrect');
            char_span.classList.add('correct');
        } else {
            correct = false;
            char_span.classList.remove('correct');
            char_span.classList.add('incorrect');
        }
    })
    console.log(`Current latest letter typed is number ${current}, which is a '${correct_letters[current].innerText}'`)
    if (correct) genBlock();
})

function getWordList(length) {
    return fetch(`${length}.txt`).then(response => response.text());
}

async function loadLists() {
    short = (await getWordList('short')).split('\n');
    medium = (await getWordList('medium')).split('\n');
    long = (await getWordList('long')).split('\n');
    document.dispatchEvent(loadedLists);   
}


async function genBlock() {
    wordsInputElement.value = null;
    //console.log(words[Math.floor(Math.random() * words.length]);

    var init_block = "";
    for(let i = 0; i < 30; i++) {
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
    init_block.split('').forEach(character => {
        const char_span = document.createElement('span');
        char_span.innerText = character;
        wordsDisplayElement.appendChild(char_span);
    })

    wordsInputElement.removeAttribute('readonly');
}

loadLists();