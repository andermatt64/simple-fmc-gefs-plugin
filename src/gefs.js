/*
 * Implements the GEFS abstraction layer that aims to be the only code that
 * directly references the gefs specific JavaScript namespace.
 *
 * The goal here is to mitigate porting difficulties upon GEFS version updates.
 */

var GEFS = {
  metersToFeet: 3.28084,

  getInitFunction: function () {
    return gefs.init;
  },

  isLoadedIntoNamespace: function () {
    return (window.gefs && GEFS.getInitFunction());
  },

  setInitFunction: function (initFn) {
    gefs.init = initFn;
  },

  getCanvas: function () {
    return gefs.canvas;
  },

  aircraft: {
    height: 0,

    getName: function () {
      return gefs.aircraft.name;
    },

    getMass: function () {
      return gefs.aircraft.rigidBody.mass;
    },

    getThrottlePosition: function () {
      return gefs.aircraft.animationValue.throttle;
    },

    isEngineOn: function () {
      return gefs.aircraft.engine.on;
    },

    getHeading: function () {
      return gefs.aircraft.animationValue.heading360;
    },

    getKias: function () {
      return gefs.aircraft.animationValue.kias;
    },

    getMachSpeed: function () {
      return gefs.aircraft.animationValue.mach;
    },

    getClimbRate: function () {
      return gefs.aircraft.animationValue.climbrate;
    },

    getFlapsPosition: function () {
      return gefs.aircraft.animationValue.flapsValue;
    },

    getGearPosition: function () {
      return gefs.aircraft.animationValue.gearPosition;
    },

    getElevatorTrimPosition: function () {
      return gefs.aircraft.animationValue.trim;
    },

    getAirBrakePosition: function () {
      return gefs.aircraft.animationValue.airbrakesPosition;
    },

    getBrakePosition: function () {
      return gefs.aircraft.animationValue.brakes;
    },

    getRollAngle: function () {
      return gefs.aircraft.animationValue.aroll;
    },

    getLocation: function () {
      return gefs.aircraft.llaLocation;
    },

    getGroundElevation: function () {
      return gefs.groundElevation;
    },

    getAltitude: function () {
      return gefs.aircraft.animationValue.altitude;
    },

    getAGL: function () {
      return GEFS.aircraft.getAltitude() - (GEFS.aircraft.getGroundElevation() * GEFS.metersToFeet) - GEFS.aircraft.height;
    }
  },

  autopilot: {
      isOn: function () {
        return controls.autopilot.on;
      },

      hookTurnOn: function (cb) {
        controls.autopilot.turnOn = function () {
          if (!gefs.aircraft.setup.autopilot) {
            return;
          }

          controls.autopilot.climbPID.reset();
          controls.autopilot.pitchPID.reset();
          controls.autopilot.rollPID.reset();
          controls.autopilot.throttlePID.reset();

          cb();

          controls.autopilot.on = true;
          ui.hud.autopilotIndicator(true);
        };
      },

      hookTurnOff: function (cb) {
        controls.autopilot.turnOff = function () {
          controls.autopilot.on = false;
          ui.hud.autopilotIndicator(false);

          cb();
        };
      },

      getHeading: function () {
        return controls.autopilot.heading;
      },

      setHeading: function (heading) {
        Log.info('AP: setting new heading=' + heading + 'deg');
        controls.autopilot.setHeading(heading);
      },

      setAltitude: function (altitude) {
        Log.info('AP: setting new altitude=' + altitude + 'ft');
        controls.autopilot.setAltitude(altitude);
      },

      setKias: function (ias) {
        Log.info('AP: setting new kias=' + kias + 'kts');
        controls.autopilot.setKias(ias);
      },

      setLimit: function (name, value) {
        controls.autopilot[name] = value;
      },

      getLimit: function (name) {
        return controls.autopilot[name];
      }
  },

  terrain: {
    setProvider: function (provider) {
      gefs.api.viewer.terrainProvider = provider;
    },

    getProvider: function () {
      return gefs.api.viewer.terrainProvider;
    },

    createEllipsoidProvider: function () {
      return new Cesium.EllipsoidTerrainProvider();
    }
  }
};
