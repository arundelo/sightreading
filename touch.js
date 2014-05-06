// Messing around with touch events.

"use strict";

var translateCoords = function(x, y) {
    return {
        x: x - this.offsetLeft,
        y: y - this.offsetTop
    };
};

var drawCircle = function(x, y) {
    var ctx = this.getContext("2d"),
        radius = 40;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI*2);
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

var clear = function() {
    var ctx = this.getContext("2d");

    ctx.clearRect(0, 0, this.width, this.height);
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
        canvas.clear = clear;
        // These things are called "menu" because eventually this is going to
        // be a (pie) menu:
        canvas.menuactive = false;
        canvas.menutouchid = null;

        // FIXME:  These callbacks have a lot of duplicated code.
        canvas.addWrappedEventListener("touchstart",
            function(ev) {
                var t;

                if (!this.menuactive) {
                    if (ev.changedTouches.length == 1) {
                        ev.preventDefault();
                        this.menuactive = true;
                        t = ev.changedTouches[0];
                        this.menutouchid = t.identifier;
                        msgpara.innerHTML = description;
                        this.coords = this.translateCoords(t.pageX, t.pageY);
                        this.drawCircle(this.coords.x, this.coords.y);
                    }
                }
            }
        );

        canvas.addWrappedEventListener("mousedown",
            function(ev) {
                if (!this.menuactive) {
                    ev.preventDefault();
                    this.menuactive = true;

                    msgpara.innerHTML = description;

                    this.mouse = true;
                    this.coords = this.translateCoords(ev.pageX, ev.pageY);
                    this.drawCircle(this.coords.x, this.coords.y);
                    // This should have already been unset by touchend, but be
                    // safe:
                    this.menutouchid = null;
                } else {
                    // FIXME:  Probably should just cancel the menu here, at
                    // least if it was a mousedown that activated the menu.
                    msgpara.innerHTML = "mousedown while menu is active!";
                }
            }
        );

        // touchend doesn't have meaningful coordinates (at least on my iPhone)
        // so keep track of the current touch's position.  FIXME:  For pie menu
        // purposes, the touchmove won't just store the current position, it
        // will change the menu selection, so there needs to be a mousemove
        // handler too.
        canvas.addWrappedEventListener("touchmove",
            function(ev) {
                var i, t;

                if (this.menuactive && typeof this.menutouchid === "number") {
                    for (i = 0; i < ev.changedTouches.length; i++) {
                        t = ev.changedTouches[i];

                        if (this.menutouchid === t.identifier) {
                            ev.preventDefault();
                            this.movecoords = this.translateCoords(
                                t.pageX, t.pageY);
                            break;
                        }
                    }
                }
            }
        );

        canvas.addWrappedEventListener("touchend",
            function(ev) {
                var i, t;

                if (this.menuactive && typeof this.menutouchid === "number") {
                    for (i = 0; i < ev.changedTouches.length; i++) {
                        t = ev.changedTouches[i];

                        if (this.menutouchid === t.identifier) {
                            ev.preventDefault();
                            // The current position is this.movecoords (if set)
                            // or this.coords.
                            this.menuactive = false;
                            this.menutouchid = null;
                            this.coords = false;
                            this.movecoords = false;
                            // Erase the circle:
                            this.clear();
                            break;
                        }
                    }
                }
            }
        );

        // E.g., user hits the home button while touching.
        canvas.addWrappedEventListener("touchcancel",
            function(ev) {
                var i, t;

                if (this.menuactive && typeof this.menutouchid === "number") {
                    for (i = 0; i < ev.changedTouches.length; i++) {
                        t = ev.changedTouches[i];
                        break;
                    }
                }

                // To be safe, cancel even if we didn't find our touch event:
                this.menuactive = false;
                this.menutouchid = null;
                this.coords = false;
                this.movecoords = false;
                // Erase the circle:
                this.clear();

                if (t) {
                    msgpara.innerHTML =
                        "touchcancel event; ev.changedTouches.length " +
                            "is&nbsp;" + ev.changedTouches.length;
                } else {
                    // Looks like this shouldn't be reached, assuming the other
                    // event handlers unset menuactive and menutouchid as
                    // necessary.
                    msgpara.innerHTML =
                        "touchcancel event; ev.changedTouches.length is " +
                            ev.changedTouches.length +
                            "; ev.changedTouches does not contain our" +
                            " touch";
                }
            }
        );

        // Unlike with touch events, a mouseup doesn't necessarily happen on
        // the same element as its mousedown.  In fact -- FIXME -- it might be
        // better to have all the listeners on the body and, as appropriate,
        // ignore the ones that aren't on the canvas.  Currently a multi-touch
        // event only one touch of which is on the canvas is seen by the
        // canvas's touchstart handler as a single touch.
        document.body.addWrappedEventListener("mouseup",
            function(ev) {
                var endcoords;

                if (canvas.menuactive) {
                    if (typeof canvas.menutouchid === "number") {
                        alert("mouseup while touch pending");
                    }
                    ev.preventDefault();
                    endcoords = canvas.translateCoords(ev.pageX, ev.pageY);
                    canvas.menuactive = false;
                    canvas.menutouchid = null;
                    canvas.coords = false;
                    canvas.movecoords = false;
                    canvas.clear();
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
