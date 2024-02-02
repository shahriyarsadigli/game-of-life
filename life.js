// the reference to the 2d context of our canvas
var canvas = document.getElementById("gl-canvas");
var context = canvas.getContext("2d");

window.onload = init;

// size of the grid is defined by the number of grid cells and the height of the canvas
var canvasHeight = canvas.clientHeight;
var GRID_CELLS = 50;
var GRID_SIZE = canvasHeight / GRID_CELLS;

// if the cell is 1 it is alive, and vice versa
var ALIVE = 1;
var DEAD = 0;

// two grids for the generation of next steps
var currentGrid;
var nextGenGrid;

// the color of the lines of the grid
var GRID_COLOR = 'black';

// the color of the cells
var FILL_COLOR = 'white'; // default value for filling the pixels
var POINT_ALIVE_COLOR = 'black';
var POINT_DEAD_COLOR = 'white';
var POINT_WAS_ALIVE_COLOR = 'white';

var currentCell;

// these cells are the neighbor cells of the current cell
var northCell, southCell, eastCell, westCell;
var n_e_Cell; // north east
var n_w_Cell; // north west
var s_e_Cell; // south east
var s_w_Cell; // south west

// counter for the number of the alive neighboring cells of the current cell
var aliveNeighbourCount = 0;

// function to initialize everything
function init() {
    controlButtons();

    // creating 2D array in order to save the data of the grid
    currentGrid = create2Darray();
    nextGenGrid = create2Darray();

    // initialize the grid with all dead cells
    resetGrid();

    // we draw a grid 
    if (context) {
        drawGrid();
        canvas.onclick = onClick;
    }
}

// function to create a 2D array to save the data of the grid
function create2Darray() {
    var myArr = new Array(GRID_CELLS);
    for (var i = 0; i < GRID_CELLS; i++) 
        myArr[i] = new Array(GRID_CELLS); // height and width of the grid are the same
    return myArr;
}

// function to reset grids
function resetGrid() {
    // initialize the whole grid as dead => assign 0
    for (var i = 0; i < GRID_CELLS; i++)
        for (var j = 0; j < GRID_CELLS; j++) {
            currentGrid[i][j] = 0;
            nextGenGrid[i][j] = 0;
        }

    // as soon as we reset the grid, we need to update the grid view
    updateGridView();
}

// functionality to download the grid
var download = document.getElementById("download");

download.addEventListener("click", function(){
    downloadGrid();
})

function downloadGrid() {
    var dowloadCurrGrid = document.createElement("a");

    // pass the current grid as a text plain file in order to download
    var file = new Blob([currentGrid], {
      type: "text/plain",
    });

    // create a url and download the file with the specified name
    dowloadCurrGrid.href = URL.createObjectURL(file);
    dowloadCurrGrid.download = "currentGrid.txt";
    
    dowloadCurrGrid.click();
};
// end of download part

// functionality to upload a grid to the canvas
var upload = document.getElementById("upload");

upload.addEventListener("change", function(e) {
    uploadGrid(e.target.files)
})

function uploadGrid(files)
{
    var reader = new FileReader();
    
    if (files.length > 0) {
        reader.onload = function() {
            var myStr = reader.result;
            
            // as the grid is stored in a string with comma separation, we split and store in an array
            arrOfCells = myStr.split(',');

            // here we traverse through the whole array of cells in order to store the value
            // we got from the input file to the grid we have and visualise it
            for (var i = 0, k = 0; i < GRID_CELLS; i++)
                for(var j = 0; j < GRID_CELLS; j++) 
                    nextGenGrid[i][j] = parseInt(arrOfCells[k++]); // as we stored the values as string, we need to parse them
            
            // update the view based on the uploaded grid
            updateGridView();
        }

        reader.readAsText(files[0]);
    }
}
// end of upload part




// function to determine the values of the neigbor cells and
// count the number of alive neigbors of the current cell
function countAliveNeighbors(i, j) {
    // initially number of neighbors is zero
    cnt = 0;

    // initialy set the values of neighboring cells as zero
    northCell = southCell = eastCell = westCell = n_e_Cell = n_w_Cell = s_e_Cell = s_w_Cell = 0;

    // we put certain conditions accordingly in order to handle the cells in the edges as well
    // because we consider the outside of the grid as dead
    if (i - 1 >= 0) 
        northCell = currentGrid[i-1][j];
    
    if (j - 1 >= 0) 
        westCell = currentGrid[i][j-1];
    
    if (i - 1 >= 0 && j - 1 >= 0) 
        n_w_Cell = currentGrid[i-1][j-1];
    
    if (i-1 >= 0 && j+1 < GRID_CELLS) 
        n_e_Cell = currentGrid[i-1][j+1];
    
    if (j+1 < GRID_CELLS) 
        eastCell = currentGrid[i][j+1];
    
    if (i+1 < GRID_CELLS) 
        southCell = currentGrid[i+1][j];
    
    if (i+1 < GRID_CELLS && j-1 >= 0) 
        s_w_Cell = currentGrid[i+1][j-1];
    
    if (i+1 < GRID_CELLS && j+1 < GRID_CELLS) 
        s_e_Cell = currentGrid[i+1][j+1];

    // sum up the number of neighbor cells
    cnt = northCell + southCell + eastCell + westCell + n_e_Cell + n_w_Cell + s_e_Cell + s_w_Cell;

    return cnt;
}

// function to control the buttons
function controlButtons() {
    var start = document.getElementById('start'); // button to start the simulation
    var pause = document.getElementById('pause'); // button to start the simulation
    var next = document.getElementById('next'); // button to create the next generation
    var reset = document.getElementById('reset'); // button to reset the grid

    start.onclick = startButton;
    pause.onclick = pauseButton;
    next.onclick = nextButton;
    reset.onclick = resetButton;
}

var play = 0; // variable to determine if the simulation is playing
var reset = 0; // variable to determine if we clicked reset
var changeInterval = 0; // variable to determine if we changed the tick interval
var tickInterval = 100; // default value for the tick interval is 100 ms

// function to update the interval of the tick based on user input
function updateTickInterval(tick) {
    var newTickVal = parseInt(tick, 10);

    // here we prevent the users from entering invalid values
    if (isNaN(newTickVal) || newTickVal < 1) 
        tickInterval = 100; // if invalid value, put default 100ms
    else 
        tickInterval = newTickVal; // else, assign new interval value

    changeInterval = 1; // a flag to show that we change the interval

    startButton(tickInterval);

    changeInterval = 0; // reset the value fot the next click
}

// function to set rows

function setRows(rows) {
    var newRowVal = parseInt(rows, 10);

    GRID_CELLS = newRowVal;
}

// function to set columns

function setCols(cols) {
    var newColVal = parseInt(cols, 10);

    GRID_CELLS = newColVal;
}


// start the simulation
function startButton(tickInterval) {
    if (play == 0 && changeInterval == 0) { // changeInterval flag is put to determine which button is clicked
        play = 1;
        this.innerHTML = "Pause"; // after I click start, it becomes the pause button
        nextGenProduction();
    } else if (play == 1 && changeInterval == 0) {
        play = 0;
        this.innerHTML = "Continue"; 
    }
}

// pause the simulation
function pauseButton() {
    play = 0;
}

// reset the grid 
function resetButton() {
    play = 0;
    document.getElementById('start').innerHTML = "Start"; // because we reset the simulation, start button is also reset
    resetGrid();
}

// create the next generation
function nextButton() {
    play = 0; // play is 0 so that it does not work continously, but it works only one cycle
    nextGenProduction();
}

// function to uptade the grid on the screen
function updateGridView() {
    for (var i = 0; i < GRID_CELLS; i++) {
        for (var j = 0; j < GRID_CELLS; j++) {
            if (nextGenGrid[i][j] == DEAD) 
                FILL_COLOR = POINT_DEAD_COLOR;
                // add here point was alive once
            else 
                FILL_COLOR = POINT_ALIVE_COLOR;
               
            drawPixel(j,i);
        }
    }

    // run the next generation function with the certain interval
    if (play == 1) {
        window.setTimeout(function () {
            nextGenProduction();
        }, tickInterval);
    }
}

// function to produce the following generation based on the current one considering the algorithm steps
function nextGenProduction () {
    // we need to iterate through each cell to see what is going to happen after reproduction
    for (var i = 0; i < GRID_CELLS; i++) {
        for (var j = 0; j < GRID_CELLS; j++) {
            aliveNeighbourCount = countAliveNeighbors(i,j);
            currentCell = currentGrid[i][j];

            // 1. Any alive cell with fewer than 2 alive neighbors dies, as if caused by underpopulation
            if (currentCell == ALIVE) {
                if (aliveNeighbourCount < 2) {
                    currentCell = DEAD; 
                    FILL_COLOR = POINT_WAS_ALIVE_COLOR; // kill the cell and fill in with a slightly different color
                }

            // 2. Any alive cell with 2 or 3 alive neighbors lives on to the next generation
                else if (aliveNeighbourCount == 2 || aliveNeighbourCount == 3) // <= 3 ?
                    currentCell = ALIVE; 

            // 3. Any alive cell with more than 3 alive neighbors dies, as if by overpopulation
                else if (aliveNeighbourCount > 3) {
                    currentCell = DEAD; 
                    FILL_COLOR = POINT_WAS_ALIVE_COLOR;
                }
            }

            // 4. Any dead cell with exactly 3 alive neighbors becomes an alive cell, as if by reproduction.
            if (currentCell == DEAD)
                if (aliveNeighbourCount == 3) 
                    currentCell = ALIVE; 

            nextGenGrid[i][j] = currentCell;
        }
    }

    updateGridView();
}

window.addEventListener('contextmenu', (e) => {
    FILL_COLOR = POINT_WAS_ALIVE_COLOR; // assign the color as dead for default
    e.preventDefault();
    rect = canvas.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;

    // calculate the coordinates within the grid
    x = Math.floor(x / GRID_SIZE);
    y = Math.floor(y / GRID_SIZE);

    drawPixel(x, y);
});

// with this function I am trying to detect the left or right click of the mouse
// in order to decide on the life of a cell // 0 is left click and 2 is right click
document.addEventListener('mouseup', (event) => {
    if (event.button == 0) {
        FILL_COLOR = POINT_ALIVE_COLOR;
    } else {
        FILL_COLOR = POINT_WAS_ALIVE_COLOR;
    }
});

// the codes below are based on the codes provided by Araz Yusubov, but in a modified manner

// function to draw a pixel based on left or right click
function drawPixelBasedOnClick(e) {
    // the coordinates of the mouse within the canvas
    rect = canvas.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;

    // calculate the coordinates within the grid
    x = Math.floor(x / GRID_SIZE);
    y = Math.floor(y / GRID_SIZE);

    drawPixel(x, y);
}

// function to draw pixel for right click (to delete the pixel)
function oncontextmenu(e) { 
    drawPixelBasedOnClick(e);
}

// function to draw pixel for left click
function onClick(e) {
    drawPixelBasedOnClick(e);
}

// draw a pixel in a grid cell with the given coordinates
function drawPixel(x, y) {
    // we fill the cell with the specified color (dead or alive)
    context.fillStyle = FILL_COLOR; 

    // when we draw a pixel, we make that pixel alive
    // x and y are reversed because on our screen y is vertical and x is horizontal
    if (FILL_COLOR == POINT_ALIVE_COLOR) 
        currentGrid[y][x] = ALIVE;
    else   
        currentGrid[y][x] = DEAD;

    x = x * GRID_SIZE;
    y = y * GRID_SIZE;

    // we fill the rectangle, but we do not fill on the grid lines, instead, we leave the
    // grid untouched so that when we make it dead again, and it does not delete lines of the grid
    context.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
}

// function to draw a lines of the grid
function drawLine(x0, y0, x1, y1) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.stroke();
}

// function to draw a grid which is going to be the "playground"
function drawGrid() {
    // the style of the lines for the grid
    context.strokeStyle = GRID_COLOR;
    context.lineWidth = 1;

    // horizontal lines of the grid
    for (y = 0; y <= canvas.clientHeight; y = y + GRID_SIZE)
        drawLine(0, y, canvas.clientHeight, y);

    // vertical lines of the grid
    for (x = 0; x <= canvas.clientHeight; x = x + GRID_SIZE)
        drawLine(x, 0, x, canvas.clientHeight);
}


