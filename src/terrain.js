/*
 * Implements a fix for bad runway terrain at certain airports
 */

 var TerrainFix = {
   ALTITUDE_THRESHOLD: 1100,
   DISTANCE_RADIUS: 10,

   _oldTerrainProvider: null,
   _ellipseProvider: null,

   init: function () {
     TerrainFix._ellipseProvider = GEFS.terrain.createEllipsoidProvider();
     TerrainFix._oldTerrainProvider = GEFS.terrain.getProvider();
     SimpleFMC.registerUpdate(TerrainFix.update);
   },

   closestAirport: function () {
      var key = null;
      var location = GEFS.aircraft.getLocation();
      var current = {
        lat: location[0],
        lon: location[1]
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
     var altitude = GEFS.aircraft.getAGL();
     if (altitude < TerrainFix.ALTITUDE_THRESHOLD) {
       var closest = TerrainFix.closestAirport();
       if (closest.distance < TerrainFix.DISTANCE_RADIUS) {
         if (TerrainFix._ellipseProvider !== GEFS.terrain.getProvider()) {
           GEFS.terrain.setProvider(TerrainFix._ellipseProvider);
         }

         return;
       }
     }

     if (TerrainFix._oldTerrainProvider !== GEFS.terrain.getProvider()) {
       GEFS.terrain.setProvider(TerrainFix._oldTerrainProvider);
     }
   }
 };
