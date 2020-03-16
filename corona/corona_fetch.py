#!/usr/bin/env python3

import datetime
import requests
import json
import sys
import os

from bs4 import BeautifulSoup

URL = "https://www.sozialministerium.at/Informationen-zum-Coronavirus/Neuartiges-Coronavirus-(2019-nCov).html"

STATES = [
    "Niederösterreich",
    "Wien",
    "Steiermark",
    "Tirol",
    "Oberösterreich",
    "Salzburg",
    "Burgenland",
    "Vorarlberg", 
    "Kärnten"
]

def main(path):
    corona_map, err = get_corona()
    if err != None:
        with open(os.path.join(path, "meta.txt"), "w") as mfh:
            mfg.write("Error occurred when fetching corona state in Austria: {}".format(err))
            sys.exit(1)

    for category, state_map in corona_map.items():
        with open(os.path.join(path, "{}.json".format(category)), "w") as cfh:
            json.dump(state_map, cfh)

    with open(os.path.join(path, "meta.txt"), "w") as mfh:
        mfh.write(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    put_history(os.path.join(path, "history_day.json"), corona_map, mode="day")
    put_history(os.path.join(path, "history_hour.json"), corona_map, mode="hour")

def put_history(history_path, new, mode="day"):
    history_string = "%Y-%m-%d"
    if mode == "hour":
        history_string = "%Y-%m-%d %H"

    history = {}
    if os.path.exists(history_path):
        with open(history_path) as hfh:
            history = json.load(hfh)

    identifier = datetime.datetime.now().strftime(history_string)
    if identifier not in history:
        history[identifier] = new
    else:
        old = history[identifier]

        sick_equal      = False if "sick" not in old.keys() else old["sick"] == new["sick"]
        recovered_equal = False if "recovered" not in old.keys() else old["recovered"] == new["recovered"]
        dead_equal      = False if "dead" not in old.keys() else old["dead"] == new["dead"]

        if sick_equal and recovered_equal and dead_equal:
            return

        history[identifier] = new

    with open(history_path, "w") as hfh:
        json.dump(history, hfh)

def get_corona():
    resp = requests.get(URL)

    if resp.status_code != 200:
        return [None, "Wrong status code: {}".format(resp.status_code)]

    soup      = BeautifulSoup(resp.content, 'html.parser')
    container = soup.find("div", {"class": "infobox"})
    if container == None:
        return [None, "Could not find main container"]

    corona_map = {
        "sick": {},
        "recovered": {},
        "dead": {}
    }
    for i in [("sick", 3), ("recovered", 4), ("dead", 5)]:
        cat, pi = i

        info_text = container.find_all("p")[pi]
        if info_text == None:
            return [None, "Could not find info text for {}".format(cat)]

        text = info_text.get_text().split(":")[-1].replace("und", ",").replace(".", ",")
        state_map = {}
        for state in STATES:
            if state not in text:
                continue

            trailing = text.split(state)[1].split(",")[0]
            trailing = trailing.replace("(", "").replace(")", "").strip()

            if trailing == "" and cat == "dead":
                trailing = text.split(state)[0].split(",")[0]
                trailing = trailing.replace("(", "").replace(")", "").strip()
            
            if "-" in trailing:
                trailing = trailing.split("-")[0].strip()

            state_map[state.lower()] = int(trailing)

        corona_map[cat] = state_map
    return [corona_map, None]

if __name__ == "__main__":
    path = ""
    if len(sys.argv) > 1:
        path = sys.argv[1]

    main(path)