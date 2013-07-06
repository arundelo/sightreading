"use strict";

// Returns a random integer n where lower <= n <= upper:
function rand(lower, upper) {
  var range = upper - lower + 1;
  return Math.floor(Math.random() * range + lower);
}

function View(canvas, msgpara) {
  this.canvas = canvas;
  this.msgpara = msgpara;
  this.colorfg = "#303030";
  var ctx = this.canvas.getContext("2d");
  ctx.fillStyle = this.colorfg;
  ctx.strokeStyle = this.colorfg;
}

// Draw a notehead at x, y that is ht tall:
View.prototype.drawnote = function(x, y, ht, filled) {
  var ctx = this.canvas.getContext("2d");
  var angle, scalefactor, majoraxisscalefactor, radius;
  /*
  https://en.wikipedia.org/wiki/File:BlackNotehead.svg
  https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/BlackNotehead.svg/200px-BlackNotehead.svg.png
  https://en.wikipedia.org/wiki/File:WhiteNotehead.svg
  https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/WhiteNotehead.svg/200px-WhiteNotehead.svg.png

  Angle is about 32 degrees counterclockwise of horizontal.  Minor axis/major
  axis is about 7/10.  In an open notehead, the inner ellipse's minor axis is
  about half of the outer's, and its major axis is about 9/10 of the outer's.
  */

  ctx.save();
  ctx.translate(x, y);
  // The ellipse's shape:
  angle = -(32 / 360 * Math.PI * 2);
  majoraxisscalefactor = 10 / 7;
  // First scale so that the rotated ellipse still ends up being ht tall.
  // There's some mathy way to calculate scalefactor given angle and
  // majoraxisscalefactor, but the following value was determined empirically.
  scalefactor = 0.85;
  ctx.scale(scalefactor, scalefactor);
  // Now rotate and scale so that ctx.arc will draw an ellipse with the correct
  // orientation and major-axis-to-minor-axis proportion:
  ctx.rotate(angle);
  ctx.scale(majoraxisscalefactor, 1);
  ctx.beginPath();
  radius = ht / 2;

  if (filled) {
    // Closed notehead:
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  } else {
    // Open notehead.
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    // Inner ellipse scale factors:
    ctx.scale(0.9, 0.5);
    // Make the inner ellipse counterclockwise (so the fill leaves the middle
    // empty):
    ctx.arc(0, 0, radius, Math.PI * 2, 0, true);
    // Used to have ctx.closePath() here but it doesn't seem necessary.

    /*
    // This is the open notehead code from before I figured out how to make
    // ctx.arc() go counterclockwise.
    ctx.moveTo(0, -radius);
    ctx.arcTo( radius, -radius,  radius,  0,      radius);
    ctx.arcTo( radius,  radius,  0,       radius, radius);
    ctx.arcTo(-radius,  radius, -radius,  0,      radius);
    ctx.arcTo(-radius, -radius,  0,      -radius, radius);

    // Inner ellipse scale factors:
    ctx.scale(0.9, 0.5);
    ctx.lineTo(0, -radius);
    // Counterclockwise:
    ctx.arcTo(-radius, -radius, -radius,  0,      radius);
    ctx.arcTo(-radius,  radius,  0,       radius, radius);
    ctx.arcTo( radius,  radius,  radius,  0,      radius);
    ctx.arcTo( radius, -radius,  0,      -radius, radius);
    ctx.closePath();
    */
  }

  ctx.fill();
  ctx.restore();
};

View.prototype.display = function(left, right) {
  var ysep = 15; // Separation between ledger lines.
  var canvas = this.canvas;
  // 0.5 is to avoid blurriness:
  var ycenter = Math.floor(canvas.height / 2) + 0.5;
  var ctx = canvas.getContext("2d");
  var i, x, y, notes;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the staff:
  for (i = -2; i < 3; i++) {
    y = ycenter + i * ysep;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw both notes:
  notes = [left, right];
  for (i = 0; i < 2; i++) {
    x = canvas.width * (i + 1) / 3;
    // The minus sign below is to translate from the musical meaning of "low"
    // and "high" to that used by canvas's y coordinates.
    y = -notes[i] * (ysep / 2) + ycenter;
    this.drawnote(x, y, ysep, Math.random() < 0.5);
  }
};

View.prototype.message = function(Html) {
  this.msgpara.innerHTML = Html;
};

function Model(view) {
  this.range = 5; // Max distance from center of staff.
  var maxinterval0 = 7 // Max interval (zero-based).
  var prevdyad;

  this.view = view;

  this.dyad = function() {
    var interval0, lo, hi;

    // The do-while just prevents this method from returning the same pair of
    // notes twice in a row:
    do {
      // Zero-based interval (i.e., 0 = unison, 1 = second):
      interval0 = rand(0, maxinterval0);
      // Low and high notes in terms of distance from center of staff:
      lo = rand(-this.range, this.range - interval0);
      hi = lo + interval0;
    } while (prevdyad !== undefined && lo === prevdyad.lo && hi == prevdyad.hi);

    // Record this dyad for later and return it:
    prevdyad = {
      lo: lo,
      hi: hi
    };

    return prevdyad;
  };

  this.prevdyad = function() {
    return prevdyad;
  };
}

Model.prototype.ask = function() {
  var dyad = this.dyad();
  var left, right;
  if (Math.random() < 0.5) {
    left = dyad.lo;
    right = dyad.hi;
  } else {
    left = dyad.hi;
    right = dyad.lo;
  }
  this.view.display(left, right);
};

Model.prototype.check = function(n) {
  var prevdyad = this.prevdyad();
  // One-based interval between hi and lo:
  var interval1 = prevdyad.hi - prevdyad.lo + 1;
  var msg;

  if (n == interval1) {
    msg = '<span style="color: #073"><b>CORRECT</b></span>';
  } else {
    msg = '<span style="color: #700"><b>INCORRECT</b> (should have pressed ' +
      interval1 + ' not ' + n + ')</span>';
  }

  this.view.message(msg);
}

function Controller(document, model) {
  var controller = this,
    buttonpara = document.getElementById("buttonpara");
  var buttonshtml, rownum, num, button;

  this.model = model;

  document.onkeydown = function(event) {
    controller.onkeydown(event);
  };

  // Make on-screen buttons.  (Not all smartphones have keyboards.)
  buttonshtml = '<table id="buttontable">';
  for (rownum = 0; rownum < 3; rownum++) {
    buttonshtml += "<tr>";
    for (num = 7 - rownum * 3; num < 10 - rownum * 3; num++) {
      buttonshtml += '<td><button id="button'
        + num
        + '" type="button" value="'
        + num
        + '">'
        + num
        + '</button></td>';
    }
    buttonshtml += "</tr>";
  }
  buttonshtml += "</table>";

  buttonpara.innerHTML = buttonshtml;

  for (num = 1; num < 10; num++) {
    button = document.getElementById("button" + num);
    button.onclick = function() {
      model.check(this.value);
      model.ask();
    };
  }
}

Controller.prototype.onkeydown = function(event) {
  var keycode = event.keyCode, zerocode = 48, numpadzerocode = 96, num = null;

  // Pay attention to 1 through 9 and ignore 0.  (Should we ignore 9 too
  // because it's just 2 plus an octave?  What about 8?)
  if (zerocode < keycode && keycode <= zerocode + 9) {
    num = keycode - zerocode;
  } else if (numpadzerocode < keycode && keycode <= numpadzerocode + 9) {
    num = keycode - numpadzerocode;
  }

  if (num !== null && !(event.shiftKey || event.ctrlKey || event.altKey)) {
    this.model.check(num);
    this.model.ask();
  }
};

function main() {
  var canvas = document.getElementById("canvas");
  var msgpara = document.getElementById("msgpara");
  var view, model, controller;
  if (canvas.getContext) {
    view = new View(canvas, msgpara);
    model = new Model(view);
    view.message("Drawing buttons ...");
    controller = new Controller(document, model);
    view.message("Drawing first pair of notes ...");
    model.ask();
    view.message("&nbsp;");
  } else {
    msgpara.innerHTML = "Sorry, your web browser does not support"
      + ' <a href="http://en.wikipedia.org/wiki/Canvas_element">'
      + "&lt;canvas&gt;</a>.";
  }
}
