import csv
import random
import shutil
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

SEED = 42
OUT_DIR = Path(__file__).resolve().parents[1] / "data" / "seed"
START_DATE = datetime(2026, 6, 1)
LAST_INCIDENT_DATE = datetime(2026, 8, 30)
END_DATE = datetime(2026, 8, 31, 23, 59, 59)

TOWERS = [
    ("T01", "Kothrud", 18.5074, 73.8077),
    ("T02", "Shivajinagar", 18.5308, 73.8475),
    ("T03", "Hadapsar", 18.5089, 73.9260),
    ("T04", "Warje", 18.4783, 73.8072),
    ("T05", "Kondhwa", 18.4636, 73.8872),
    ("T06", "Yerwada", 18.5580, 73.8827),
    ("T07", "Hinjewadi", 18.5908, 73.7397),
    ("T08", "Swargate", 18.5006, 73.8580),
    ("T09", "Camp", 18.5157, 73.8794),
    ("T10", "Baner", 18.5590, 73.7868),
]
TOWER_AREAS = [t[1] for t in TOWERS]
TOWER_BY_AREA = {t[1]: t[0] for t in TOWERS}

POLICE_STATION_BY_AREA = {
    "Kothrud": "Kothrud",
    "Shivajinagar": "Shivajinagar",
    "Hadapsar": "Hadapsar",
    "Warje": "Warje Malwadi",
    "Kondhwa": "Kondhwa",
    "Yerwada": "Yerwada",
    "Hinjewadi": "Hinjewadi",
    "Swargate": "Swargate",
    "Camp": "Lashkar",
    "Baner": "Chatushrungi",
}

AREA_STREETS = {
    "Kothrud": ["Karve Road", "Paud Road", "Mayur Colony", "Dahanukar Colony", "Kothrud Depot"],
    "Shivajinagar": ["FC Road", "JM Road", "Ghole Road", "Model Colony", "Apte Road"],
    "Hadapsar": ["Magarpatta Road", "Solapur Road", "Sasane Nagar", "Mundhwa Road"],
    "Warje": ["Warje Malwadi", "Karve Nagar", "Atul Nagar", "Ramnagar", "NDA Road"],
    "Kondhwa": ["NIBM Road", "Kondhwa Khurd", "Kausar Baug", "Mithanagar", "Katraj Kondhwa Road"],
    "Yerwada": ["Airport Road", "Nagar Road", "Shastri Nagar", "Laxmi Nagar"],
    "Hinjewadi": ["Hinjewadi Phase 1", "Wakad Road", "Maan Road", "Marunji Road"],
    "Swargate": ["Satara Road", "Shankarsheth Road", "Gultekdi", "Market Yard"],
    "Camp": ["MG Road", "East Street", "Sachapir Street", "Bund Garden Road"],
    "Baner": ["Baner Road", "Pashan Sus Road", "Balewadi Phata", "Baner Pashan Link Road"],
}

GANG_A_HOME_AREAS = ["Warje", "Kothrud", "Swargate"]
GANG_B_HOME_AREAS = ["Kondhwa", "Hadapsar", "Camp"]

HINDU_MALE_FIRST = [
    "Ramesh", "Suresh", "Vikram", "Sanjay", "Anil", "Prakash", "Dinesh", "Mahesh",
    "Rajesh", "Ganesh", "Nitin", "Sunil", "Ashok", "Ravindra", "Vijay", "Santosh",
    "Arun", "Milind", "Yogesh", "Pravin", "Amit", "Rahul", "Rohit", "Kiran",
    "Sachin", "Vaibhav", "Sagar", "Swapnil", "Tushar", "Abhijit", "Manoj",
    "Deepak", "Umesh", "Vishal", "Ajay",
]
HINDU_FEMALE_FIRST = [
    "Sunita", "Rekha", "Manisha", "Kavita", "Anita", "Shobha", "Pooja", "Sneha",
    "Priya", "Vaishali", "Nanda", "Vandana", "Jyoti", "Meena", "Asha", "Rupali",
    "Sarita", "Neha", "Swati", "Archana",
]
HINDU_SURNAMES = [
    "Shinde", "Jadhav", "Pawar", "Kulkarni", "Deshmukh", "More", "Kale", "Bhosale",
    "Patil", "Gaikwad", "Chavan", "Sawant", "Kadam", "Kamble", "Salunkhe", "Mane",
    "Thorat", "Joshi", "Desai",
]
MUSLIM_MALE_FIRST = [
    "Imran", "Farhan", "Salman", "Javed", "Aslam", "Irfan", "Nadeem", "Tanveer",
]
MUSLIM_FEMALE_FIRST = ["Ayesha", "Nazia", "Shabana", "Rukhsana"]
MUSLIM_SURNAMES = ["Shaikh", "Khan", "Sayyed", "Pathan", "Ansari", "Qureshi", "Inamdar"]

ALIASES = [
    "Vicky", "Bunty", "Tinku", "Pintya", "Bhau", "Anna", "Dada", "Chotu", "Guru",
    "Bablya", "Nanya", "Sonu", "Golya", "Bhagya", "Lucky", "Raju", "Kaka", "Mama",
    "Bhai", "Pappu", "Danny", "Sultan", "Baba", "Chandu",
]
VEHICLE_TYPES = ["motorcycle", "scooter", "car"]
TXN_MODES = ["UPI", "IMPS", "NEFT", "RTGS"]
DRUG_SUBSTANCES = ["ganja", "charas", "mephedrone", "heroin"]


@dataclass
class Person:
    name: str
    gender: str
    alias: str | None
    age: int
    address: str
    account: str | None
    vehicle: str | None
    prior_case_count: int
    gang: str | None
    role: str
    phone: str | None = None
    phone_hidden: bool = False
    rank: str | None = None


def make_name(rng, used_names, genders, muslim_share):
    while True:
        gender = rng.choice(genders)
        if rng.random() < muslim_share:
            first_pool = MUSLIM_MALE_FIRST if gender == "M" else MUSLIM_FEMALE_FIRST
            surname_pool = MUSLIM_SURNAMES
        else:
            first_pool = HINDU_MALE_FIRST if gender == "M" else HINDU_FEMALE_FIRST
            surname_pool = HINDU_SURNAMES
        name = f"{rng.choice(first_pool)} {rng.choice(surname_pool)}"
        if name not in used_names:
            used_names.add(name)
            return name, gender


def make_alias(rng, used_aliases):
    while True:
        alias = rng.choice(ALIASES)
        if alias not in used_aliases:
            used_aliases.add(alias)
            return alias


def pick_area(rng, home_areas):
    if home_areas and rng.random() < 0.8:
        return rng.choice(home_areas)
    return rng.choice(TOWER_AREAS)


def make_address(rng, area):
    street = rng.choice(AREA_STREETS[area])
    if rng.random() < 0.5:
        return f"Flat {rng.randint(1, 499)}, {street}, {area}, Pune"
    return f"H.No. {rng.randint(1, 999)}, {street}, {area}, Pune"


def make_phone(rng, used_phones):
    while True:
        number = rng.choice("6789") + "".join(rng.choice("0123456789") for _ in range(9))
        if number not in used_phones:
            used_phones.add(number)
            return number


def make_account(rng, used_accounts):
    length = rng.choice([11, 12, 13, 14])
    while True:
        number = "".join(rng.choice("0123456789") for _ in range(length))
        if number not in used_accounts:
            used_accounts.add(number)
            return number


def make_plate(rng, used_plates):
    while True:
        series = rng.choice(["12", "14"])
        letters = "".join(rng.choice("ABCDEFGHJKLMNPQRSTUVWXYZ") for _ in range(2))
        number = rng.randint(1, 9999)
        plate = f"MH {series} {letters} {number:04d}"
        if plate not in used_plates:
            used_plates.add(plate)
            return plate


def format_inr(amount):
    text = str(amount)
    if len(text) <= 3:
        return text
    last3 = text[-3:]
    rest = text[:-3]
    parts = []
    while len(rest) > 2:
        parts.insert(0, rest[-2:])
        rest = rest[:-2]
    if rest:
        parts.insert(0, rest)
    return ",".join(parts + [last3])


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S+05:30")


def random_datetime_in_window(rng, start, end):
    span_seconds = int((end - start).total_seconds())
    offset = rng.randint(0, span_seconds)
    return start + timedelta(seconds=offset)


def ensure_first(accused, person):
    if person in accused:
        accused.remove(person)
        accused.insert(0, person)
    else:
        accused[0] = person


def new_person(rng, used_names, used_aliases, used_accounts, gang, role, has_alias, has_account,
               age_range, genders, muslim_share, home_areas):
    name, gender = make_name(rng, used_names, genders, muslim_share)
    alias = make_alias(rng, used_aliases) if has_alias else None
    age = rng.randint(*age_range)
    address = make_address(rng, pick_area(rng, home_areas))
    account = make_account(rng, used_accounts) if has_account else None
    prior_case_count = rng.randint(0, 1) if role == "intermediary" else rng.randint(1, 8)
    return Person(
        name=name, gender=gender, alias=alias, age=age, address=address,
        account=account, vehicle=None, prior_case_count=prior_case_count,
        gang=gang, role=role,
    )


def new_officer(rng, used_names, rank):
    name, gender = make_name(rng, used_names, ["M"], 0.0)
    age = rng.randint(28, 45)
    return Person(
        name=name, gender=gender, alias=None, age=age, address="", account=None,
        vehicle=None, prior_case_count=0, gang=None, role="officer", rank=rank,
    )


def build_universe(rng, used_names, used_aliases, used_phones, used_accounts, used_plates):
    kingpin = new_person(
        rng, used_names, used_aliases, used_accounts, "A", "kingpin", True, True,
        (35, 55), ["M"], 0.15, GANG_A_HOME_AREAS,
    )
    lieutenants = [
        new_person(
            rng, used_names, used_aliases, used_accounts, "A", "lieutenant", True, True,
            (28, 48), ["M"], 0.15, GANG_A_HOME_AREAS,
        )
        for _ in range(2)
    ]
    members_a = [
        new_person(
            rng, used_names, used_aliases, used_accounts, "A", "member", rng.random() < 0.5, False,
            (19, 40), ["M"], 0.15, GANG_A_HOME_AREAS,
        )
        for _ in range(9)
    ]
    gang_a = [kingpin] + lieutenants + members_a

    leader_b = new_person(
        rng, used_names, used_aliases, used_accounts, "B", "leader", True, True,
        (32, 55), ["M"], 0.35, GANG_B_HOME_AREAS,
    )
    members_b = [
        new_person(
            rng, used_names, used_aliases, used_accounts, "B", "member", rng.random() < 0.5, False,
            (19, 40), ["M"], 0.35, GANG_B_HOME_AREAS,
        )
        for _ in range(8)
    ]
    gang_b = [leader_b] + members_b

    intermediary = new_person(
        rng, used_names, used_aliases, used_accounts, None, "intermediary", True, True,
        (30, 50), ["M"], 0.2, None,
    )

    civilians_a = [
        new_person(
            rng, used_names, used_aliases, used_accounts, "A", "civilian", False, False,
            (20, 65), ["M", "F"], 0.2, None,
        )
        for _ in range(10)
    ]
    civilians_b = [
        new_person(
            rng, used_names, used_aliases, used_accounts, "B", "civilian", False, False,
            (20, 65), ["M", "F"], 0.2, None,
        )
        for _ in range(10)
    ]

    officers = [new_officer(rng, used_names, rng.choice(["PSI", "API"])) for _ in range(4)]

    all_gang = gang_a + gang_b
    for person in all_gang + [intermediary] + civilians_a + civilians_b + officers:
        person.phone = make_phone(rng, used_phones)

    shuffled_gang = list(all_gang)
    rng.shuffle(shuffled_gang)
    vehicle_count = len(shuffled_gang) // 3
    for person in shuffled_gang[:vehicle_count]:
        person.vehicle = make_plate(rng, used_plates)

    hidden_pool = list(all_gang)
    rng.shuffle(hidden_pool)
    hidden_count = len(hidden_pool) // 2
    for person in hidden_pool[:hidden_count]:
        person.phone_hidden = True

    return {
        "kingpin": kingpin,
        "lieutenants": lieutenants,
        "members_a": members_a,
        "gang_a": gang_a,
        "leader_b": leader_b,
        "members_b": members_b,
        "gang_b": gang_b,
        "intermediary": intermediary,
        "civilians_a": civilians_a,
        "civilians_b": civilians_b,
        "officers": officers,
    }


def pick_drug_details(rng):
    substance = rng.choice(DRUG_SUBSTANCES)
    if substance == "ganja":
        band = rng.choice(["A", "B", "C"])
        if band == "A":
            quantity = f"{rng.randint(200, 950)} grams"
        elif band == "B":
            quantity = f"{rng.randint(1, 19)} kg"
        else:
            quantity = f"{rng.randint(21, 60)} kg"
        clause = f"20(b)(ii)({band})"
    else:
        clause = rng.choice(["21(b)", "22(b)"])
        if clause == "21(b)":
            quantity = f"{rng.randint(5, 90)} grams"
        else:
            quantity = f"{rng.randint(150, 900)} grams"
    sections = f"8(c) r/w {clause} NDPS Act 1985"
    return substance, quantity, sections


def amount_for(crime_type, rng):
    if crime_type == "extortion":
        return rng.randrange(10000, 500001, 5000)
    if crime_type == "theft":
        return rng.randrange(1000, 300001, 500)
    if crime_type == "cyber_fraud":
        return round(rng.randint(8000, 490000), -2)
    if crime_type == "drug":
        return rng.randrange(5000, 300001, 1000)
    return None


THEFT_TEMPLATES = [
    {"text": "The complainant states that on {date} at about {itime} hrs near {location} the accused, identified as {accused_clause}, snatched the complainant's belongings and fled. The stolen articles are valued at Rs. {amount}. Passersby who witnessed the incident alerted the local police. A case has been registered for investigation{phone_clause}.{burner_clause}", "sections": "304(2)"},
    {"text": "On {date} at about {itime} hrs, the complainant was walking near {location} when {accused_clause} approached from behind and forcibly took away cash and articles worth Rs. {amount}. The complainant immediately raised an alarm but the accused escaped. Station staff have taken up the investigation{phone_clause}.{burner_clause}", "sections": "304(2)"},
    {"text": "The complainant reports that {poss} premises near {location} were broken into on {date}, with articles worth Rs. {amount} found missing when {subj} returned at about {itime} hrs. Local inquiry pointed to {accused_clause} as a suspect. Neighbours confirmed suspicious movement around the property that night. The matter has been registered for further action{phone_clause}.{burner_clause}", "sections": "303(2)"},
    {"text": "At about {itime} hrs on {date}, near {location}, {accused_phrase} stopped the complainant and demanded {poss} belongings, later identified as {accused_clause}. The accused took away valuables worth Rs. {amount} and left the spot within minutes. The complainant reported the matter at the earliest opportunity. Investigation has been taken up by the station{phone_clause}.{burner_clause}", "sections": "304(2)"},
    {"text": "The complainant, returning home near {location} on {date} at about {itime} hrs, found that {accused_clause} had removed {poss} bag containing cash and documents worth Rs. {amount}. A hue and cry was raised but the accused could not be caught. The complainant lodged the report the same day{phone_clause}.{burner_clause}", "sections": "303(2)"},
    {"text": "It is stated that on {date} at about {itime} hrs, the complainant's vehicle was parked near {location} when {accused_clause} tampered with it and removed articles worth Rs. {amount}. A shopkeeper nearby noticed the act and informed the complainant. The complainant approached the police station to lodge the complaint. The matter is under investigation{phone_clause}.{burner_clause}", "sections": "303(2)"},
    {"text": "The complainant narrates that while boarding a bus near {location} on {date} at about {itime} hrs, {accused_clause} slit {poss} bag and escaped with cash and valuables worth Rs. {amount}. Fellow passengers tried to chase the accused without success. The complainant reported the loss at the earliest{phone_clause}.{burner_clause}", "sections": "303(2)"},
    {"text": "On {date} at about {itime} hrs, the complainant left {poss} two-wheeler unattended near {location} for a few minutes and on returning found it missing. Local sources identified {accused_clause} as involved in the theft, the vehicle being valued at Rs. {amount}. CCTV footage from a nearby shop is being examined. A case has been registered accordingly{phone_clause}.{burner_clause}", "sections": "303(2)"},
]

EXTORTION_TEMPLATES = [
    {"text": "The complainant states that on {date} at about {itime} hrs near {location} the accused, identified as {accused_clause}, stopped {pronoun} and demanded Rs. {amount}{phone_clause}. The complainant was threatened with dire consequences if the amount was not paid. Fearing for {poss} safety, the complainant approached the police station to lodge a report. Investigation has been taken up.{burner_clause}", "sections": "308(2), 351(3)"},
    {"text": "On {date} at about {itime} hrs, the complainant received a visit from {accused_clause} near {location}, who demanded Rs. {amount} failing which the complainant's shop would be shut down{phone_clause}. Threats of violence were repeated over the following days. The complainant, unable to bear the pressure, reported the matter to the police. A case has been registered.{burner_clause}", "sections": "308(2), 351(2)"},
    {"text": "It is stated that the complainant was contacted near {location} on {date} at about {itime} hrs by {accused_clause}, who demanded a sum of Rs. {amount} for allowing the complainant's business to continue{phone_clause}. On refusal, threats were issued against the complainant's family. The complainant reported the extortion attempt the same evening.{burner_clause}", "sections": "308(2), 351(3)"},
    {"text": "The complainant reports that on {date} at about {itime} hrs, while returning from work near {location}, {subj} was intercepted by {accused_clause}, who demanded Rs. {amount} citing an old dispute{phone_clause}. The complainant was warned of consequences if the police were informed. Despite the threat, the complainant approached the station to lodge the report. The matter is under investigation.{burner_clause}", "sections": "308(2), 351(2)"},
    {"text": "As per the complaint, {accused_clause} approached the complainant near {location} on {date} at about {itime} hrs and demanded protection money of Rs. {amount}{phone_clause}. The complainant was told that failure to pay would result in harm to {poss} establishment. The complainant reported the incident to the police the following morning. Necessary sections have been applied.{burner_clause}", "sections": "308(2), 351(2)"},
    {"text": "The complainant states that {accused_clause}, along with associates, cornered {pronoun} near {location} on {date} at about {itime} hrs and demanded Rs. {amount}{phone_clause}. When the complainant expressed inability to pay, {subj} was threatened with physical harm. The complainant lodged the report soon after the incident. Investigation has been initiated.{burner_clause}", "sections": "308(2), 351(3)"},
    {"text": "On {date} at about {itime} hrs near {location}, the complainant was accosted by {accused_clause}, who insisted on payment of Rs. {amount} within three days{phone_clause}. Failure to comply, the complainant was told, would invite serious consequences. The complainant reported the threat to the police without delay. The case has been registered for investigation.{burner_clause}", "sections": "308(2), 351(2)"},
    {"text": "The complainant narrates that {accused_clause} met {pronoun} near {location} on {date} at about {itime} hrs and demanded Rs. {amount} for settling a fabricated claim{phone_clause}. Threats to the complainant's family were made in case of non-payment. The complainant approached the police station the same day to report the matter. The investigation has been taken up accordingly.{burner_clause}", "sections": "308(2), 351(3)"},
]

ASSAULT_TEMPLATES = [
    {"text": "The complainant states that on {date} at about {itime} hrs near {location}, {accused_clause} assaulted {pronoun} following a heated argument{phone_clause}. The complainant sustained injuries and was taken to a nearby hospital for treatment. Passersby intervened and separated the parties. The complainant reported the matter to the police thereafter.{burner_clause}", "sections": "115(2), 351(2)"},
    {"text": "On {date} at about {itime} hrs, the complainant was walking near {location} when {accused_clause} blocked {poss} path and started beating {pronoun} over a previous dispute{phone_clause}. The complainant suffered injuries to {poss} head and hands. Neighbours rushed to help and the accused fled the spot. The complainant lodged the report soon after.{burner_clause}", "sections": "115(2), 351(2)"},
    {"text": "It is stated that {accused_clause} attacked the complainant near {location} on {date} at about {itime} hrs using a blunt weapon{phone_clause}. The complainant sustained grievous injuries and was rushed to hospital. Family members present at the scene identified the accused. A case has been registered for the assault.{burner_clause}", "sections": "117(2), 351(3)"},
    {"text": "The complainant reports that on {date} at about {itime} hrs, an altercation with {accused_clause} near {location} escalated into a physical assault{phone_clause}. The complainant was struck repeatedly before bystanders intervened. The complainant was examined at a government hospital for the injuries. The matter has been reported to the police.{burner_clause}", "sections": "115(2), 351(2)"},
    {"text": "As per the complaint, {accused_clause}, along with others, waylaid the complainant near {location} on {date} at about {itime} hrs and assaulted {pronoun}{phone_clause}. The complainant was left with bruises and a fractured hand. The incident was witnessed by shopkeepers in the area. The complainant lodged the report at the earliest.{burner_clause}", "sections": "117(2), 351(3)"},
    {"text": "The complainant narrates that on {date} at about {itime} hrs near {location}, {subj} was confronted by {accused_clause} over a monetary dispute and beaten with fists and kicks{phone_clause}. The complainant sought medical attention for the injuries sustained. Onlookers eventually separated the two parties. A case has been registered by the police.{burner_clause}", "sections": "115(2), 351(2)"},
    {"text": "On {date} at about {itime} hrs, the complainant was dragged out of {poss} shop near {location} by {accused_clause} in full public view{phone_clause}. The complainant was pushed and manhandled but sustained no serious injury. Local residents recorded the incident on their phones. The complainant approached the police station immediately after.{burner_clause}", "sections": "131"},
    {"text": "The complainant states that a quarrel with {accused_clause} near {location} on {date} turned violent at about {itime} hrs{phone_clause}. The complainant was pushed to the ground and repeatedly kicked. Family members present rushed {pronoun} to a nearby clinic. The matter has been reported to the police for necessary action.{burner_clause}", "sections": "115(2), 351(2)"},
]

DRUG_TEMPLATES = [
    {"text": "The complainant states that, acting on specific information received on {date}, a team conducted a raid near {location} at about {itime} hrs and apprehended {accused_clause}. {quantity} of {substance} was recovered from the accused's possession, valued at Rs. {amount}{phone_clause}. The accused could not produce any valid documents for the substance. The seized material has been sent for chemical analysis.{burner_clause}"},
    {"text": "The complainant states that, on receiving credible information about drug peddling activity near {location}, a police party intercepted {accused_clause} on {date} at about {itime} hrs. {quantity} of {substance} valued at Rs. {amount} was recovered from the accused's bag{phone_clause}. Panch witnesses were called to the spot before the search. The accused has been taken into custody for further investigation.{burner_clause}"},
    {"text": "The complainant states that, while on patrol duty near {location} on {date} at about {itime} hrs, the team noticed {accused_clause} behaving suspiciously. On being searched, {quantity} of {substance} worth Rs. {amount} was found on the accused's person{phone_clause}. The accused failed to explain the source of the substance. A case has been registered under the relevant provisions.{burner_clause}"},
    {"text": "The complainant states that a decoy operation was conducted near {location} on {date} at about {itime} hrs, leading to the apprehension of {accused_clause}. {quantity} of {substance} meant for sale, valued at Rs. {amount}, was seized from the accused{phone_clause}. The operation was carried out based on prior surveillance. The seized contraband has been sealed and sent for analysis.{burner_clause}"},
    {"text": "The complainant states that, acting on a tip-off, the team cordoned off an area near {location} on {date} at about {itime} hrs and caught {accused_clause} in the act of handing over packets to a buyer. {quantity} of {substance} worth Rs. {amount} was recovered and seized on the spot{phone_clause}. The buyer managed to escape during the raid. The accused has been arrested and the matter registered.{burner_clause}"},
    {"text": "The complainant, part of the anti-narcotics squad, states that {accused_clause} was found in possession of {quantity} of {substance} near {location} on {date} at about {itime} hrs. The recovered material has been valued at Rs. {amount}{phone_clause}. The accused was unable to produce a licence for the substance. The case has been forwarded for chemical examination.{burner_clause}"},
    {"text": "The complainant states that surveillance near {location} led to the identification of {accused_clause} as a supplier of {substance}. The accused was apprehended on {date} at about {itime} hrs with {quantity} valued at Rs. {amount}{phone_clause}. Local residents had earlier complained of suspicious activity in the area. The accused has been taken into custody.{burner_clause}"},
    {"text": "The complainant states that on {date} at about {itime} hrs, a raiding party intercepted {accused_clause} near {location} following information about a consignment of {substance}. {quantity} valued at Rs. {amount} was seized from a bag in the accused's possession{phone_clause}. The accused attempted to flee but was overpowered by the team. The seizure memo has been prepared and the case registered.{burner_clause}"},
]

CYBER_FRAUD_TEMPLATES = [
    {"text": "The complainant states that {subj} received a call on {date} at about {itime} hrs from {accused_clause}, posing as a bank official and requesting {poss} card details{phone_clause}. Believing the call to be genuine, the complainant shared the details and later found Rs. {amount} debited from {poss} account. The transaction was traced near {location}. The complainant approached the police upon discovering the fraud.{burner_clause}", "itc": "66D"},
    {"text": "On {date} at about {itime} hrs, the complainant received a message claiming a prize win, leading {pronoun} to click a link that later resulted in unauthorised debit of Rs. {amount} from {poss} account{phone_clause}. Technical tracing linked the transaction to {accused_clause}, operating from near {location}. The complainant noticed the fraud upon checking {poss} bank statement. A complaint has been lodged for cyber fraud.{burner_clause}", "itc": "66D"},
    {"text": "It is stated that the complainant was contacted on {date} at about {itime} hrs by {accused_clause} offering an online investment scheme{phone_clause}. The complainant transferred Rs. {amount} to the account provided, after which all contact was lost. The transaction was later traced to an address near {location}. The complainant filed the complaint after repeated attempts to reach the accused failed.{burner_clause}", "itc": "66D"},
    {"text": "The complainant reports that {poss} social media account was compromised on {date} at about {itime} hrs, and messages were sent to {poss} contacts requesting money on behalf of {accused_clause}{phone_clause}. One contact transferred Rs. {amount} before the fraud was noticed. Investigation traced the activity to a location near {location}. The complainant has requested action against the accused.{burner_clause}", "itc": "66C"},
    {"text": "As per the complaint, the complainant's debit card details were used without authorisation on {date} at about {itime} hrs to make purchases worth Rs. {amount}{phone_clause}. Bank records pointed towards {accused_clause}, active near {location}. The complainant had not shared {poss} card details with anyone. The matter has been reported for cyber investigation.{burner_clause}", "itc": "66C"},
    {"text": "The complainant narrates that {subj} was duped on {date} at about {itime} hrs into installing a remote access application by a caller identified later as {accused_clause}{phone_clause}. Rs. {amount} was subsequently transferred out of {poss} account without {poss} consent. The transaction was linked to a device near {location}. The complainant reported the incident soon after discovering the loss.{burner_clause}", "itc": "66D"},
    {"text": "On {date} at about {itime} hrs, the complainant responded to a fraudulent job offer online, after which {subj} was asked to pay a registration fee to {accused_clause}{phone_clause}. The complainant transferred Rs. {amount} before realising the offer was fake. The funds were traced to an account operated near {location}. The complainant has approached the police for recovery and action.{burner_clause}", "itc": "66D"},
    {"text": "The complainant states that an unknown caller, later identified as {accused_clause}, obtained {poss} one-time password on {date} at about {itime} hrs under the pretext of a KYC update{phone_clause}. This led to an unauthorised transfer of Rs. {amount} from {poss} account. The activity was traced to near {location}. The complainant reported the fraud immediately upon noticing the debit.{burner_clause}", "itc": "66D"},
]

TEMPLATES_BY_TYPE = {
    "theft": THEFT_TEMPLATES,
    "extortion": EXTORTION_TEMPLATES,
    "assault": ASSAULT_TEMPLATES,
    "drug": DRUG_TEMPLATES,
    "cyber_fraud": CYBER_FRAUD_TEMPLATES,
}

ACCUSED_COUNT_WORDS = {1: "a person", 2: "two persons", 3: "three persons"}


@dataclass
class Incident:
    fir_no: int
    crime_type: str
    gang: str
    template_idx: int
    incident_dt: datetime
    report_dt: datetime
    location: str
    police_station: str
    sections: str
    complainant: Person
    accused: list
    vehicles: list
    phones: list
    amount: int | None
    narrative: str
    burner: bool = False


def person_desc(person):
    return f"{person.name} alias {person.alias}" if person.alias else person.name


def build_accused_clause(rng, accused):
    parts = []
    vehicles_used = []
    shown = 0
    for acc in accused:
        vehicle_suffix = ""
        if acc.vehicle and shown < 2:
            vtype = rng.choice(VEHICLE_TYPES)
            vehicle_suffix = f", on a {vtype} bearing registration {acc.vehicle}"
            vehicles_used.append(acc.vehicle)
            shown += 1
        parts.append(f"{person_desc(acc)}, r/o {acc.address}{vehicle_suffix}")
    return ", along with ".join(parts), vehicles_used


def build_incidents(rng, universe, to_reveal):
    incidents = []
    fir_no = 1
    plan = [
        ("extortion", "A", 8),
        ("assault", "A", 8),
        ("theft", "A", 4),
        ("drug", "B", 8),
        ("cyber_fraud", "B", 8),
        ("theft", "B", 4),
    ]
    burner_lieutenant = universe["lieutenants"][0]
    burner_slots = {("extortion", "A"): [0, 3], ("assault", "A"): [1]}
    template_counters = {crime_type: 0 for crime_type in TEMPLATES_BY_TYPE}
    complainant_counters = {"A": 0, "B": 0}

    for crime_type, gang, count in plan:
        pool = universe["gang_a"] if gang == "A" else universe["gang_b"]
        civilians = universe["civilians_a"] if gang == "A" else universe["civilians_b"]
        burner_indices = burner_slots.get((crime_type, gang), [])
        for local_idx in range(count):
            template_idx = template_counters[crime_type] % len(TEMPLATES_BY_TYPE[crime_type])
            template_counters[crime_type] += 1
            is_burner = local_idx in burner_indices

            if crime_type == "drug":
                complainant = rng.choice(universe["officers"])
            else:
                complainant = civilians[complainant_counters[gang] % len(civilians)]
                complainant_counters[gang] += 1

            accused_count = rng.choice([1, 1, 2, 2, 3])
            shuffled = list(pool)
            rng.shuffle(shuffled)
            accused = shuffled[:accused_count]

            forced_reveal = False
            if is_burner:
                ensure_first(accused, burner_lieutenant)
            elif to_reveal[gang]:
                ensure_first(accused, to_reveal[gang].pop(0))
                forced_reveal = True

            location = rng.choice(TOWER_AREAS)
            police_station = POLICE_STATION_BY_AREA[location]
            incident_dt = random_datetime_in_window(rng, START_DATE, LAST_INCIDENT_DATE)
            incident_dt = incident_dt.replace(second=0, microsecond=0)
            report_delay = timedelta(minutes=rng.randint(20, 300))
            report_dt = incident_dt + report_delay

            phone_reveal = None
            if not is_burner and (forced_reveal or rng.random() < 0.75):
                phone_reveal = accused[0]

            amount = amount_for(crime_type, rng)

            accused_clause, vehicles = build_accused_clause(rng, accused)

            phone_clause = ""
            if phone_reveal is not None:
                if crime_type == "extortion":
                    phone_clause = f". The accused later called the complainant from mobile number {phone_reveal.phone}"
                elif crime_type == "cyber_fraud":
                    phone_clause = f", using mobile number {phone_reveal.phone} for the calls"
                elif crime_type == "theft":
                    phone_clause = f". The accused was traced through mobile number {phone_reveal.phone}"
                else:
                    phone_clause = f". The accused was tracked through mobile number {phone_reveal.phone}"

            burner_clause = ""
            burner_number = None
            if is_burner:
                burner_number = universe["burner_phone"]
                burner_clause = (
                    f" Investigation revealed that mobile number {burner_number} linked to "
                    f"{person_desc(burner_lieutenant)} was active between midnight and 4 am on the "
                    f"intervening night before the incident."
                )

            substance = quantity = None
            if crime_type == "drug":
                substance, quantity, sections_text = pick_drug_details(rng)
            else:
                sections_text = None

            ctx = {
                "date": incident_dt.strftime("%d/%m/%Y"),
                "itime": incident_dt.strftime("%H:%M"),
                "location": location,
                "accused_clause": accused_clause,
                "accused_phrase": ACCUSED_COUNT_WORDS.get(len(accused), f"{len(accused)} persons"),
                "phone_clause": phone_clause,
                "burner_clause": burner_clause,
                "amount": format_inr(amount) if amount else "",
                "substance": substance,
                "quantity": quantity,
                "subj": "she" if complainant.gender == "F" else "he",
                "pronoun": "her" if complainant.gender == "F" else "him",
                "poss": "her" if complainant.gender == "F" else "his",
            }
            template_entry = TEMPLATES_BY_TYPE[crime_type][template_idx]
            narrative = template_entry["text"].format(**ctx)

            phones = [complainant.phone]
            if is_burner:
                phones.append(burner_number)
            elif phone_reveal is not None:
                phones.append(phone_reveal.phone)

            several = len(accused) > 1
            suffix = ", 3(5)" if several else ""
            if crime_type == "cyber_fraud":
                sections = f"318(4){suffix} BNS 2023, {template_entry['itc']} IT Act 2000"
            elif crime_type == "drug":
                sections = sections_text
            else:
                sections = f"{template_entry['sections']}{suffix} BNS 2023"

            incidents.append(Incident(
                fir_no=fir_no, crime_type=crime_type, gang=gang, template_idx=template_idx,
                incident_dt=incident_dt, report_dt=report_dt, location=location,
                police_station=police_station, sections=sections, complainant=complainant,
                accused=accused, vehicles=vehicles, phones=phones, amount=amount,
                narrative=narrative, burner=is_burner,
            ))
            fir_no += 1

    return incidents


def render_fir(incident):
    lines = []
    fir_no_str = f"{incident.fir_no:04d}"
    lines.append(
        f"FIR No. {fir_no_str}/2026, Police Station {incident.police_station}, District Pune City."
    )
    lines.append(
        f"Date and time of report: {incident.report_dt.strftime('%d/%m/%Y')} at "
        f"{incident.report_dt.strftime('%H:%M')} hrs."
    )
    lines.append(f"Sections: {incident.sections}.")
    complainant = incident.complainant
    if complainant.role == "officer":
        lines.append(
            f"Complainant: {complainant.rank} {complainant.name}, aged {complainant.age}, "
            f"attached to {incident.police_station} Police Station, Pune, mobile {complainant.phone}."
        )
    else:
        honorific = "Shri" if complainant.gender == "M" else "Smt"
        lines.append(
            f"Complainant: {honorific} {complainant.name}, aged {complainant.age}, "
            f"r/o {complainant.address}, mobile {complainant.phone}."
        )
    lines.append("")
    lines.append(incident.narrative)
    lines.append("")

    accused_parts = []
    for acc in incident.accused:
        alias_part = f" alias {acc.alias}" if acc.alias else ""
        accused_parts.append(f"{acc.name}{alias_part}, aged {acc.age}, r/o {acc.address}")
    lines.append("Accused: " + "; ".join(accused_parts) + ".")

    if incident.vehicles:
        lines.append("Vehicles: " + ", ".join(incident.vehicles) + ".")

    lines.append("Phone numbers: " + ", ".join(incident.phones) + ".")

    if incident.amount:
        lines.append(f"Amount: Rs. {format_inr(incident.amount)}.")

    return "\n".join(lines) + "\n"


def build_background_phone_pools(rng, universe, used_phones):
    background_a = [make_phone(rng, used_phones) for _ in range(15)]
    background_b = [make_phone(rng, used_phones) for _ in range(15)]
    return background_a, background_b


def build_background_account_pools(rng, used_accounts):
    background_a = [make_account(rng, used_accounts) for _ in range(15)]
    background_b = [make_account(rng, used_accounts) for _ in range(15)]
    return background_a, background_b


def generate_cdr(rng, universe, incidents, background_a, background_b):
    rows = []

    def add_row(caller, callee, dt, tower_area):
        rows.append({
            "caller": caller,
            "callee": callee,
            "start_time": iso(dt),
            "duration_sec": rng.randint(10, 1800),
            "tower_id": TOWER_BY_AREA[tower_area],
            "tower_location": tower_area,
        })

    phones_a = [p.phone for p in universe["gang_a"]] + [p.phone for p in universe["civilians_a"]] + background_a
    phones_b = [p.phone for p in universe["gang_b"]] + [p.phone for p in universe["civilians_b"]] + background_b

    for incident in incidents:
        if incident.crime_type == "extortion" and not incident.burner:
            accused_phone = None
            for acc in incident.accused:
                if acc.phone in incident.phones:
                    accused_phone = acc.phone
                    break
            if accused_phone:
                call_dt = incident.incident_dt + timedelta(minutes=rng.randint(5, 90))
                add_row(accused_phone, incident.complainant.phone, call_dt, incident.location)

    burst_incident = next(i for i in incidents if i.gang == "A" and not i.burner)
    burst_phones = rng.sample([p.phone for p in universe["members_a"]], 2)
    burst_start = burst_incident.incident_dt.replace(hour=18, minute=0, second=0) - timedelta(days=1)
    burst_count = rng.randint(12, 20)
    for _ in range(burst_count):
        offset = rng.randint(0, 2 * 3600)
        dt = burst_start + timedelta(seconds=offset)
        caller, callee = burst_phones if rng.random() < 0.5 else (burst_phones[1], burst_phones[0])
        add_row(caller, callee, dt, burst_incident.location)

    burner_incidents = [i for i in incidents if i.burner]
    gang_a_phones_no_lieutenant = [p.phone for p in universe["gang_a"] if p is not universe["lieutenants"][0]]
    for incident in burner_incidents:
        night_start = incident.incident_dt.replace(hour=0, minute=0, second=0)
        for _ in range(rng.randint(4, 6)):
            minute = rng.randint(0, 239)
            dt = night_start + timedelta(minutes=minute)
            callee = rng.choice(gang_a_phones_no_lieutenant)
            add_row(universe["burner_phone"], callee, dt, incident.location)

    gang_a_contact = universe["kingpin"].phone
    gang_b_contact = universe["leader_b"].phone
    background_contact = rng.choice(background_a)
    intermediary_calls = (
        [(universe["intermediary"].phone, gang_a_contact)] * 4
        + [(universe["intermediary"].phone, gang_b_contact)] * 4
        + [(universe["intermediary"].phone, background_contact)] * 2
    )
    for caller, callee in intermediary_calls:
        dt = random_datetime_in_window(rng, START_DATE, END_DATE)
        add_row(caller, callee, dt, rng.choice(TOWER_AREAS))

    target_rows = 3000
    while len(rows) < target_rows:
        side = rng.choice(["A", "B"])
        pool = phones_a if side == "A" else phones_b
        caller, callee = rng.sample(pool, 2)
        if rng.random() < 0.05:
            dt = random_datetime_in_window(rng, START_DATE, END_DATE)
            dt = dt.replace(hour=rng.randint(0, 3), minute=rng.randint(0, 59))
        else:
            dt = random_datetime_in_window(rng, START_DATE, END_DATE)
            dt = dt.replace(hour=rng.randint(4, 23))
        add_row(caller, callee, dt, rng.choice(TOWER_AREAS))

    rows.sort(key=lambda r: r["start_time"])
    return rows


def generate_transactions(rng, universe, background_accounts_a, background_accounts_b, mule_accounts):
    rows = []
    txn_counter = 0

    def add_row(from_account, to_account, amount, dt, mode):
        nonlocal txn_counter
        txn_counter += 1
        rows.append({
            "txn_id": f"TXN{txn_counter:06d}",
            "from_account": from_account,
            "to_account": to_account,
            "amount": amount,
            "timestamp": iso(dt),
            "mode": mode,
        })

    week_starts = [
        START_DATE + timedelta(days=5),
        START_DATE + timedelta(days=35),
        START_DATE + timedelta(days=65),
    ]
    forward_targets = [universe["kingpin"].account, universe["kingpin"].account, universe["leader_b"].account]
    source_pools = [background_accounts_a, background_accounts_a, background_accounts_b]

    for mule_account, week_start, forward_target, source_pool in zip(
        mule_accounts, week_starts, forward_targets, source_pools
    ):
        transfer_count = rng.randint(6, 10)
        total = 0
        last_dt = week_start
        for _ in range(transfer_count):
            source = rng.choice(source_pool)
            amount = rng.randint(40000, 49999)
            total += amount
            offset = rng.randint(0, 6 * 86400)
            dt = week_start + timedelta(seconds=offset)
            last_dt = max(last_dt, dt)
            add_row(source, mule_account, amount, dt, rng.choice(TXN_MODES))
        forward_dt = last_dt + timedelta(hours=rng.randint(2, 47))
        add_row(mule_account, forward_target, total, forward_dt, rng.choice(TXN_MODES))

    intermediary_account = universe["intermediary"].account
    cross_pairs = [
        (intermediary_account, universe["kingpin"].account),
        (universe["kingpin"].account, intermediary_account),
        (intermediary_account, universe["leader_b"].account),
        (universe["leader_b"].account, intermediary_account),
    ]
    for from_acc, to_acc in cross_pairs:
        dt = random_datetime_in_window(rng, START_DATE, END_DATE)
        amount = rng.randint(5000, 200000)
        add_row(from_acc, to_acc, amount, dt, rng.choice(TXN_MODES))

    accounts_a = [universe["kingpin"].account] + [l.account for l in universe["lieutenants"]] + background_accounts_a
    accounts_b = [universe["leader_b"].account] + background_accounts_b

    target_rows = 800
    while len(rows) < target_rows:
        side = rng.choice(["A", "B"])
        pool = accounts_a if side == "A" else accounts_b
        from_acc, to_acc = rng.sample(pool, 2)
        amount = rng.randint(500, 100000)
        dt = random_datetime_in_window(rng, START_DATE, END_DATE)
        add_row(from_acc, to_acc, amount, dt, rng.choice(TXN_MODES))

    rows.sort(key=lambda r: r["timestamp"])
    return rows


def write_fir_files(incidents):
    fir_dir = OUT_DIR / "fir"
    if fir_dir.exists():
        shutil.rmtree(fir_dir)
    fir_dir.mkdir(parents=True)
    for incident in incidents:
        fir_no_str = f"{incident.fir_no:04d}"
        path = fir_dir / f"FIR-2026-{fir_no_str}.txt"
        path.write_text(render_fir(incident), encoding="utf-8", newline="\n")
    return len(incidents)


def write_cdr(rows):
    path = OUT_DIR / "cdr.csv"
    fieldnames = ["caller", "callee", "start_time", "duration_sec", "tower_id", "tower_location"]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    return len(rows)


def write_transactions(rows):
    path = OUT_DIR / "transactions.csv"
    fieldnames = ["txn_id", "from_account", "to_account", "amount", "timestamp", "mode"]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    return len(rows)


def write_persons(universe):
    path = OUT_DIR / "persons.csv"
    fieldnames = ["name", "alias", "phone", "account", "address", "prior_case_count"]
    people = universe["gang_a"] + universe["gang_b"] + [universe["intermediary"]]
    people = sorted(people, key=lambda p: p.name)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for person in people:
            writer.writerow({
                "name": person.name,
                "alias": person.alias or "",
                "phone": "" if person.phone_hidden else person.phone,
                "account": person.account or "",
                "address": person.address,
                "prior_case_count": person.prior_case_count,
            })
    return len(people)


def main():
    rng = random.Random(SEED)
    used_names, used_aliases, used_phones, used_accounts, used_plates = set(), set(), set(), set(), set()

    universe = build_universe(rng, used_names, used_aliases, used_phones, used_accounts, used_plates)
    universe["burner_phone"] = make_phone(rng, used_phones)

    to_reveal_a = [p for p in universe["gang_a"] if p.phone_hidden]
    to_reveal_b = [p for p in universe["gang_b"] if p.phone_hidden]
    rng.shuffle(to_reveal_a)
    rng.shuffle(to_reveal_b)
    to_reveal = {"A": to_reveal_a, "B": to_reveal_b}

    incidents = build_incidents(rng, universe, to_reveal)

    background_phones_a, background_phones_b = build_background_phone_pools(rng, universe, used_phones)
    background_accounts_a, background_accounts_b = build_background_account_pools(rng, used_accounts)
    mule_accounts = [make_account(rng, used_accounts) for _ in range(3)]

    cdr_rows = generate_cdr(rng, universe, incidents, background_phones_a, background_phones_b)
    txn_rows = generate_transactions(rng, universe, background_accounts_a, background_accounts_b, mule_accounts)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    fir_count = write_fir_files(incidents)
    cdr_count = write_cdr(cdr_rows)
    txn_count = write_transactions(txn_rows)
    persons_count = write_persons(universe)

    print(f"fir files: {fir_count}")
    print(f"cdr rows: {cdr_count}")
    print(f"transactions rows: {txn_count}")
    print(f"persons rows: {persons_count}")


if __name__ == "__main__":
    main()
