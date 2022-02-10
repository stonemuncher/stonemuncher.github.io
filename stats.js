const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const stats = document.getElementById('statscontent');

const GRACE_WORDS = 0;


var user_values = {};
var words_typed = 0;
var totals_history = [];

// Load all information necessary to draw the graph
// This is first, the Overall values (sum of key difficulties) in the 
// history array (taken at 10 word intervals since the start of the user's profile)
// Secondly the number of words typed
// Thirdly the user_values (individual key difficulties)
async function load_values() {
        if (localStorage.getItem("history")) {
                totals_history = JSON.parse(localStorage.getItem("history")).map(function(item) {
                        return parseFloat(item);
                    });
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
}

// Helper function to get the Overall score (sum of key difficulties)
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

resp = "Here are the keys in order of descending difficulty to you: ";
for (const item of values) {
        resp += item[0] + ", ";
}
resp = resp.slice(0, -2);
stats.innerText += "\n\n"+resp;

let labels = [];

// If there is a history set, it must have been loaded so draw the graph
if (totals_history) {

        // Since the history values are taken every 10 words, we can use the number of words typed and the 
        // GRACE_WORDS to generate the array of X values that correspond the the number of words typed at the time
        // the history values were recorded.
        for (let i = GRACE_WORDS; i < words_typed; i+=10) {
                labels.push(i);
        }
        console.log(labels);

        const data = {
                labels: labels,
                datasets: [{
                  label: 'Total keys difficulty',
                  backgroundColor: 'rgb(255, 99, 132)',
                  borderColor: 'rgb(255, 99, 132)',
                  data: totals_history,
                }]
              };

        const config = {
                type: 'line',
                data: data,
                options: {
                        responsive: true,
                        scales: {
                          x: {
                            title: {
                              color: 'black',
                              display: true,
                              text: 'Words typed'
                            }
                          },
                          y: {
                                  title: {
                                          colour: 'black',
                                          display: true,
                                          text: 'Total keys difficulty (lower is better)'
                                  }
                          }
                        }
                      }
              };
        
        const myChart = new Chart(
                document.getElementById('myChart'),
                config
              );
} 
