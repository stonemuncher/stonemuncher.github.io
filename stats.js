const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const stats = document.getElementById('statscontent');

var user_values = {};
var words_typed = 0;

async function load_values() {
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
}


function get_total() {
        total = 0
        for (const key in user_values) {
                total += user_values[key];
        }
        return total;
}

load_values();
stats.innerText = "Overall score: " + get_total();

let values = [];
for (const key in user_values) {
        values.push([key, user_values[key]]);
}
values = reverse_merge(values);

resp = "Here is the alphabet in order of descending difficulty to you: ";
for (const item of values) {
        resp += item[0] + ", ";
}
resp = resp.slice(0, -2);
stats.innerText += "\n\n"+resp;