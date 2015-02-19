// AUXILIARY FUNCTIONS

// generate random number, pass in upper limit and whether integer if desired
var pickRandom = function(range, isInteger) {
    var num = Math.random() * range;
    if (isInteger) {
        return Math.floor(num);
    } else {
        return num;
    }
};

// randomize integers from 0 to count-1
// game only needs sequence of 3, but function will work for any positive integer
var randomSequence = function(count) {
    var index = [],
    sequence = [],
    num;
    for (var i = count - 1; i >= 0; i--) {
        index.push(i);
    }
    for (i = count; i > 1; i--) {
        num = pickRandom(i, true);
        num = index.splice(num, 1);
        sequence.push(num[0]);
    }
    sequence.push(index[0]);
    return sequence;
};

// ENEMIES AND ASSOCIATED FUNCTIONALITY

var Enemy = function() {
    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = 'images/enemy-bug.png';
    this.speed = pickRandom(50) + 35;
    this.y = (pickRandom(3, true) + 1) * 83 - 20;
    this.x = pickRandom(400) - 100;
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x += this.speed * dt;
    if (this.x > 505) {
        this.x = -200;
        this.speed = pickRandom(50) + 30;
    }
};

// Draw the enemy on the screen
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

//PLAYER AND ASSOCIATED FUNCTIONALITY

var Player = function() {
    // randomly select girl or boy
    switch (pickRandom(2, true)) {
        case 0:
        this.sprite = 'images/char-horn-girl.png';
        break;
        case 1:
        this.sprite = 'images/char-boy.png';
        break;
    }
    this.y = 415;
    this.x = pickRandom(400);
    this.hasGem = false;
};

// player moves or handles gems
Player.prototype.handleInput = function(key) {
    var distance = 20, newGem, holdGem;
    switch (key) {
        case 'up':
        this.y -= distance;
        break;
        case 'down':
        this.y += distance;
        break;
        case 'left':
        this.x -= distance;
        break;
        case 'right':
        this.x += distance;
        break;
        case 'spacebar':
        // check for gem
        newGem = this.checkCollision(gems.collection, true);
        if (newGem) {
            // pick up if player has no gem
            if (!this.hasGem) {
                this.pickUp(newGem);
            } else {
                // player has gem, so exchange for new one
                holdGem = this.hasGem;
                this.pickUp(newGem);
                this.placeOnBoard(holdGem);
            }
        } else if (this.hasGem) {
            // no new gem but player has one, so place on board
            this.placeOnBoard(this.hasGem);
            this.hasGem = false;
        }
        break;
    }
};

// Keep player on the game board, handle collisions
Player.prototype.update = function() {
    if (this.x > 420)
        this.x = 420;
    if (this.x < -15)
        this.x = -15;
    if (this.y > 435)
        this.y = 435;
    if (this.y < -12)
        this.y = -12;
    if (this.hasGem) {
        this.hasGem.y = this.y + 105;
        this.hasGem.x = this.x + 70;
    }
    if (this.checkCollision(allEnemies, true)) {
        // collision with enemy bug; reset player
        this.placeOnBoard(this.hasGem);
        player = new Player();
    }
};

// check for collisions with other objects
Player.prototype.checkCollision = function(object, isArray) {
    // check for single object
    if (!isArray) {
        return this.coincide(object);
    }
    // return false if player on bridge (can use x coord from any gem)
    if ((bridge.built) && (this.x >= gems.collection[0].x - 20) &&
        (this.x <= gems.collection[0].x + 20)) {
        return false;
    }
    // check each element of an array of objects
    for (var i = object.length - 1; i >= 0; i--) {
        if (this.coincide(object[i])) {
            return object[i];
        }
    }
};

// see if player and another object overlap
Player.prototype.coincide = function(object) {
    if ((this.y > object.y - 65) && (this.y < object.y + 20) &&
        (this.x > object.x - 50) && (this.x < object.x + 60)) {
            return true;
    }
};

// set small gem image to display to right of player
// when gem is picked up
Player.prototype.pickUp = function(gem) {
    gem.width = 35;
    gem.height = 35;
    // player shouldn't collide with held gem
    gem.onBoard = false;
    this.hasGem = gem;
};

// place gems exactly on board squares so they line up for bridge
Player.prototype.placeOnBoard = function(gem) {
    gem.x = Math.floor((this.x + 50) / 101) * 101;
    gem.y = Math.floor((this.y + 41) / 83) * 83 + 25;
    gem.width = 101;
    gem.height = 101;
    gem.onBoard = true;
    // check if gems are in place
    gems.checkGems();
};

Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

//GEMS AND ASSOCIATED FUNCTIONALITY

//gem constructor
var Gem = function(string) {
    this.sprite = 'images/gem-' + string + '.png';
    this.y = pickRandom(475);
    this.x = pickRandom(400);
    this.width = 101;
    this.height = 101;
    this.onBoard = true;
};

// use scaling so player-held gem can be rendered smaller
Gem.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y, this.width, this.height);
};

// create gems object
var gems = {};
gems.collection = [new Gem('blue'), new Gem('green'), new Gem('orange')];
// set random order for gems to match in order to turn into rainbow bridge
gems.sequence = randomSequence(gems.collection.length);
gems.gemsInPlace = false;

// when a gem is placed on the board, check whether the gems are lined up
// across the road in the order set in the sequence property
gems.checkGems = function() {
    // are they in the same column?
    if ((gems.collection[0].x == gems.collection[1].x) &&
        (gems.collection[0].x == gems.collection[2].x)) {
        // are they in the proper rows?
        var first = gems.sequence[0],
        second = gems.sequence[1],
        third = gems.sequence[2];
        if ((gems.collection[first].y == 274) &&
            (gems.collection[second].y == 191) &&
            (gems.collection[third].y == 108)) {
            this.gemsInPlace = true;
        }
    }
};

// draw gems or bridge, if the gems are in place
gems.render = function(dt) {
    if (this.gemsInPlace) {
        // gems lined up so update bridge until it is full length
        // pass in starting x coord from lined-up gem
        bridge.update(dt);
        // draw bridge
        bridge.render(this.collection[0].x);
    }
        else {
            // gems not in place for bridge, so draw them
            for (var i = gems.collection.length - 1; i >= 0; i--) {
            gems.collection[i].render();
        }
    }
};

//BRIDGE AND ASSOCIATED FUNCTIONALITY

var bridge = {};
bridge.colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
bridge.built = false;
bridge.yStart = 382;
bridge.yStop = 382;

// change endpoint each cycle to animate bridge when it is first drawn
bridge.update = function(dt) {
    if (gems.gemsInPlace && !(bridge.built)) {
        this.yStop -= 100 * dt;
        // stop when bridge is finished
        if (this.yStop < 133) {
            this.yStop = 133;
            this.built = true;
        }
    }
};

// draw bridge as lines of color
bridge.render = function(x) {
    ctx.lineWidth = 17;
    for (var i = 0; i < this.colors.length; i++) {
        // x needs to be offset a little to fit in columns
        var xStart = x + 7 + i * 17;
        ctx.strokeStyle = this.colors[i];
        ctx.beginPath();
        ctx.moveTo(xStart, this.yStart);
        ctx.lineTo(xStart, this.yStop);
        ctx.closePath();
        ctx.stroke();
    }
};


// initialize enemies array
var allEnemies = [];
for (var i = 7; i; i--) {
    allEnemies[i - 1] = new Enemy();
}

// initialize player
var player = new Player();

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        32: 'spacebar'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
