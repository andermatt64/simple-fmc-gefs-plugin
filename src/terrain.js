/*
 * Implements a fix for bad runway terrain at certain airports
 */

 var TerrainFix = {
   ALTITUDE_THRESHOLD: 1100,
   DISTANCE_RADIUS: 10,

   _oldTerrainProvider: null,
   _ellipseProvider: null,

   init: function () {
     TerrainFix._ellipseProvider = new Cesium.EllipsoidTerrainProvider();
     TerrainFix._oldTerrainProvider = gefs.api.viewer.terrainProvider;
     SimpleFMC.registerUpdate(TerrainFix.update);
   },

   closestAirport: function () {
      var key = null;
      var current = {
        lat: gefs.aircraft.llaLocation[0],
        lon: gefs.aircraft.llaLocation[1]
      };
      var closest = {
        name: "",
        distance: 999999
      };
      var airportFix = ["VHHH",
                        "OMDB",
                        "ZBAA",
                        "WSSS",
                        "SAEZ",
                        "NZAA",
                        "FACT",
                        "EDDM",
                        "YPPH",
                        "EGLL"];
      for (var i = 0; i < airportFix.length; i++) {
          key = LOCATION_DB.airports[airportFix[i]];
          if (key !== undefined) {
              var distance = Utils.getGreatCircleDistance(current, key);
              if (distance < closest.distance) {
                  closest.name = airportFix[i];
                  closest.distance = distance;
              }
          }
      }

      return closest;
   },

   update: function () {
     var altitude = gefs.aircraft.animationValue.altitude - (gefs.groundElevation * AGLStatus.metersToFeet) - AGLStatus._planeHeight;
     if (altitude < TerrainFix.ALTITUDE_THRESHOLD) {
       var closest = TerrainFix.closestAirport();
       if (closest.distance < TerrainFix.DISTANCE_RADIUS) {
         if (TerrainFix._ellipseProvider !== gefs.api.viewer.terrainProvider) {
           gefs.api.viewer.terrainProvider = TerrainFix._ellipseProvider;
         }

         return;
       }
     }

     if (TerrainFix._oldTerrainProvider !== gefs.api.viewer.terrainProvider) {
       gefs.api.viewer.terrainProvider = TerrainFix._oldTerrainProvider;
     }
   }
 };
