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

var exceptiontostring = function(e) {
    var errormsg = e.toString();

    if (e.stack) {
        // In Firefox the stack trace does not include the error message but in
        // Chrome it does, so it'll be repeated.  Annoying but not worth it to
        // code around now.
        errormsg += "\n" + e.stack;
    }

    return errormsg;
};

// Wraps a function in a try-catch:
var decoratesafe = function(f) {
    return function() {
        var that = this;
        var e;

        try {
            return f.apply(that, arguments);
        } catch (e) {
            alert(exceptiontostring(e));
        }
    };
};

// Like addEventListener but wraps the callback in a try-catch:
var addWrappedEventListener = function(eventname, f) {
    this.addEventListener(eventname, decoratesafe(f));
};

function main() {
    var canvas = document.getElementById("canvas");
    var msgpara = document.getElementById("msgpara");

    if (canvas.getContext) {
        var description = "Touch events demo (mouse works too)";

        msgpara.innerHTML = "Setting up event handlers ...";
        canvas.addWrappedEventListener = addWrappedEventListener;
        document.body.addWrappedEventListener = addWrappedEventListener;
        canvas.translateCoords = translateCoords;
        canvas.drawCircle = drawCircle;
        canvas.drawLine = drawLine;

        canvas.addWrappedEventListener("touchstart",
            function(ev) {
                if (!this.touch && !this.mouse) {
                    if (ev.changedTouches.length == 1) {
                        ev.preventDefault();
                        msgpara.innerHTML = description;
                        this.touch = ev.changedTouches[0];
                        this.coords = this.translateCoords(ev.pageX, ev.pageY);
                        this.drawCircle(this.coords.x, this.coords.y);
                    }
                } else if (this.touch) {
                    throw new Error(
                        "touchstart while a previous touchstart is pending");
                }
            }
        );

        canvas.addWrappedEventListener("mousedown",
            function(ev) {
                if (!this.touch) {
                    ev.preventDefault();

                    if (this.mouse) {
                        msgpara.innerHTML = "Missing mouseup!";
                    } else {
                        msgpara.innerHTML = description;
                    }

                    this.mouse = true;
                    this.coords = this.translateCoords(ev.pageX, ev.pageY);
                    this.drawCircle(this.coords.x, this.coords.y);
                }
            }
        );

        // touchend doesn't have meaningful coordinates (at least on my iPhone)
        // so keep track of the current touch's position:
        canvas.addWrappedEventListener("touchmove",
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

        canvas.addWrappedEventListener("touchend",
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
                        if (this.movecoords) {
                            this.drawLine(
                                this.coords.x, this.coords.y,
                                this.movecoords.x, this.movecoords.y);
                            this.drawCircle(this.movecoords.x, this.movecoords.y);
                        }
                        this.touch = false;
                        this.coords = false;
                        this.movecoords = false;
                    }
                }
            }
        );

        // E.g., user hits the home button while touching.
        canvas.addWrappedEventListener("touchcancel",
            function(ev) {
                if (this.touch) {
                    var match = false;

                    for (var i = 0; i < ev.changedTouches.length; i++) {
                        if (this.touch === ev.changedTouches[i]) {
                            match = true;
                            break;
                        }
                    }

                    // To be safe, cancel even if we didn't find our touch
                    // event:
                    this.touch = false;
                    this.coords = false;
                    this.movecoords = false;

                    if (match) {
                        msgpara.innerHTML =
                            "touchcancel event; ev.changedTouches.length " +
                                "is&nbsp;" + ev.changedTouches.length;
                    } else {
                        // Looks like this shouldn't be reached, assuming the
                        // other event handlers delete this.touch when
                        // necessary.
                        msgpara.innerHTML =
                            "touchcancel event; ev.changedTouches.length is " +
                                ev.changedTouches.length +
                                "; ev.changedTouches does not contain our" +
                                " touch";
                    }
                }
            }
        );

        // Unlike with touch events, a mouseup doesn't necessarily happen on
        // the same element as its mousedown:
        document.body.addWrappedEventListener("mouseup",
            function(ev) {
                if (canvas.mouse) {
                    ev.preventDefault();
                    var endcoords = canvas.translateCoords(
                        ev.pageX, ev.pageY);
                    canvas.drawLine(
                        canvas.coords.x, canvas.coords.y,
                        endcoords.x, endcoords.y);
                    canvas.drawCircle(endcoords.x, endcoords.y);
                    canvas.mouse = false;
                    canvas.coords = false;
                }
            }
        );

        msgpara.innerHTML = description;
    } else {
        msgpara.innerHTML = "Sorry, your web browser does not support"
            + ' <a href="http://en.wikipedia.org/wiki/Canvas_element">'
            + "&lt;canvas&gt;</a>.";
    }
}

// vim: set sw=4 ts=4:
