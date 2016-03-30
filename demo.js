var RobotArm = require('./robotarm.js');


var robotarm = new RobotArm.Controller("127.0.0.1", 9876);
var colors = RobotArm.Colors; // to compare: if (arm.scan() == color.red) {}

robotarm.moveRight();

robotarm.drop();