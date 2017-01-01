import os
import re
import sys
import json

# This script will provide a huge hash map based off the lat/lon for
# nearby airports

if __name__ == "__main__":
    content = None
    with open("locations.js", "rb") as fd:
        content = fd.read()
    if content is None:
        print "[error] could not read locations.js"
        sys.exit(-1)

    content = content.replace("\n", "")
    raw_json = re.findall(r'LOCATION_DB = (.*);', content)[0]
    
    location_db = json.loads(raw_json)
    airports = location_db["airports"]
    
    coords = {}
    for code, info in airports.items():
        lat = info["lat"]
        lon = info["lon"]
        
        l1_key = "%d,%d" % (int(lat) / 2, int(lon) / 2)
        l2_key = "%d,%d" % (abs(int(lat)) % 2, abs(int(lon)) % 2)
        l3_key = "%d,%d" % (abs(lat - int(lat)) * 2, abs(lon - int(lon)) * 2)

        if not l1_key in coords:
            coords[l1_key] = {}
        
        if not l2_key in coords[l1_key]:
            coords[l1_key][l2_key] = {}

        if not l3_key in coords[l1_key][l2_key]:
            coords[l1_key][l2_key][l3_key] = []

        coords[l1_key][l2_key][l3_key].append(code)

    with open("airport_map.js", "wb") as fd:
        fd.write("/*\n")
        fd.write(" * Map of airports according to latitude/longitude\n")
        fd.write(" */\n\n")
        fd.write("AIRPORT_MAP = %s;\n" % json.dumps(coords))

    print "Run js-beautify -r airport_map.js"
