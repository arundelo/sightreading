// Messing around with touch events.

"use strict";

var translateCoords = function(x, y) {
    return {
        x: x - this.offsetLeft,
        y: y - this.offsetTop
    };
};

var drawCircle = function(x, y) {
    var ctx = this.getContext("2d");

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
};

var drawLine = function(startx, starty, endx, endy) {
    var ctx = this.getContext("2d");

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startx, starty);
    ctx.lineTo(endx, endy);
    ctx.stroke();
    ctx.restore();
};

function main() {
    var canvas = document.getElementById("canvas");
    var msgpara = document.getElementById("msgpara");

    if (canvas.getContext) {
        msgpara.innerHTML = "Setting up event handlers ...";

        canvas.translateCoords = translateCoords;
        canvas.drawCircle = drawCircle;
        canvas.drawLine = drawLine;

        canvas.addEventListener("touchstart",
            function(ev) {
                if (!this.touch) {
                    if (ev.changedTouches.length == 1) {
                        ev.preventDefault();
                        this.touch = ev.changedTouches[0];
                        this.coords = this.translateCoords(ev.pageX, ev.pageY);
                        this.drawCircle(this.coords.x, this.coords.y);
                    }
                }
            }
        );

        canvas.addEventListener("mousedown",
            function(ev) {
                ev.preventDefault();
                this.coords = this.translateCoords(ev.pageX, ev.pageY);
                this.drawCircle(this.coords.x, this.coords.y);
            }
        );

        // touchend doesn't have meaningful coordinates (at least on my iPhone)
        // so keep track of the current touch's position:
        canvas.addEventListener("touchmove",
            function(ev) {
                if (this.touch) {
                    var update = false;

                    for (var i = 0; i < ev.changedTouches.length; i++) {
                        if (this.touch === ev.changedTouches[i]) {
                            update = true;
                            break;
                        }
                    }

                    if (update) {
                        ev.preventDefault();
                        this.movecoords = this.translateCoords(
                            ev.pageX, ev.pageY);
                    }
                }
            }
        );

        canvas.addEventListener("touchend",
            function(ev) {
                if (this.touch) {
                    var end = false;

                    for (var i = 0; i < ev.changedTouches.length; i++) {
                        if (this.touch === ev.changedTouches[i]) {
                            end = true;
                            break;
                        }
                    }

                    if (end) {
                        ev.preventDefault();
                        this.drawLine(
                            this.coords.x, this.coords.y,
                            this.movecoords.x, this.movecoords.y);
                        this.drawCircle(this.movecoords.x, this.movecoords.y);
                        this.touch = false;
                        this.coords = false;
                        this.movecoords = false;
                    }
                }
            }
        );

        canvas.addEventListener("mouseup",
            function(ev) {
                if (this.coords) {
                    ev.preventDefault();
                    var endcoords = this.translateCoords(
                        ev.pageX, ev.pageY);
                    this.drawLine(
                        this.coords.x, this.coords.y,
                        endcoords.x, endcoords.y);
                    this.drawCircle(endcoords.x, endcoords.y);
                    this.touch = false;
                    this.coords = false;
                }
            }
        );

        msgpara.innerHTML = "Touch events demo (mouse works too)";
    } else {
        msgpara.innerHTML = "Sorry, your web browser does not support"
            + ' <a href="http://en.wikipedia.org/wiki/Canvas_element">'
            + "&lt;canvas&gt;</a>.";
    }
}

// vim: set sw=4 ts=4:
