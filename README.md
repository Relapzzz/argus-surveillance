# AI-Powered Criminal Network Analysis System

Smart India Hackathon 2026 project for the National Crime Records Bureau. It reads FIRs, call records and bank transactions, extracts people, phones, vehicles, places and organizations, links them into a network, ranks the key players, flags suspicious patterns and shows it all on an interactive graph.

All data in this repository is synthetic.

## Run the backend

Needs uv and Python 3.12.

```
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

API docs at http://localhost:8000/docs.

## Run the frontend

Needs Bun. Copy frontend/.env.example to frontend/.env and set VITE_API_KEY to the API_KEY from backend/.env.

```
cd frontend
bun install
bun run dev
```

App at http://localhost:5173.

## The case in the demo dataset

Everything below is synthetic and was generated with a fixed seed, but it is built the way a real investigation looks: 40 FIRs from nine Pune police stations between June and August 2026, about 3,000 call detail records and 800 bank transfers. Read separately, the FIRs are eight extortion cases, eight assaults, eight thefts, eight drug seizures and eight cyber frauds. Read together, they describe two gangs and the man who connects them.

The Warje gang (Group 0 on the network). Aslam Khan alias Chotu runs it from Swargate and drives the car MH 14 JX 0154 that appears in several complaints. His lieutenants are Ramesh More alias Baba and Kiran Desai alias Dada, both from Warje. Nine members do the street work: Sachin Patil, Vaibhav Sawant, Salman Khan, Prakash Jadhav, Ramesh Kulkarni, Sunil Thorat, Deepak Shinde, Ajay Deshmukh and Vaibhav Patil. Their extortion and assault cases cluster around Warje, Kothrud and Swargate.

The Kondhwa group (Group 1). Vijay Desai alias Vicky leads it from Kondhwa with eight members: Rohit Kamble, Javed Ansari, Imran Shaikh, Tanveer Sayyed, Sanjay Jadhav, Santosh Kadam, Ravindra Chavan and Irfan Shaikh. Sanjay Jadhav is the most frequently named accused in the whole corpus, with nine FIRs. Their cases sit around Kondhwa, Hadapsar and Camp, and include the drug seizures and cyber frauds.

No FIR names members of both gangs. An investigator reading the register would see two unrelated sets of cases. The system finds what links them:

- The go-between. Dinesh Deshmukh alias Mama of Kondhwa is never named in any FIR. He exists only in the criminal history file, the call records and the bank statements. His phone 6318699938 talks to Aslam Khan, Kiran Desai, Vijay Desai and Rohit Kamble. His account 3487401640052 received Rs 1,47,274 from Aslam Khan's account and Rs 2,43,863 from Vijay Desai's account. With only five connections he is the only route between the two groups, which is why he has the highest betweenness score of anyone and why the bridge alert points at him.
- The money. Three mule accounts each collect eight or nine transfers of Rs 40,000 to Rs 49,999 inside a week, every one under the Rs 50,000 reporting threshold, then forward the whole sum. Two of them (Rs 4,07,743 on 12 June and Rs 3,91,880 on 12 July) pay into Aslam Khan's account 13389083863. The third (Rs 3,55,315 on 10 August) pays into Vijay Desai's account 1834738299737. Both gangs launder money the same way.
- The burner phone. FIR-2026-0001 mentions phone 8210470952 as linked to Ramesh More. The call records show all 15 of its calls fall between midnight and 4 am on the nights before incidents, to Aslam Khan, Deepak Shinde, Salman Khan and Prakash Jadhav.
- The call burst. Prakash Jadhav and Salman Khan exchanged 10 calls between 19:02 and 19:52 on 6 July 2026, the evening before an incident.
- The complainant's trail. Swapnil Joshi reported in FIR-2026-0001 that Ramesh More, Vaibhav Sawant and Aslam Khan stopped him in Shivajinagar and demanded Rs 4,40,000. His phone 9774964990 reaches Aslam Khan in three hops through the phones of Ajay Deshmukh and Aslam Khan himself, because the extortion calls are in the call records.

The live upload closes the story. backend/data/demo/FIR-2026-0041.txt is a new complaint from Swargate in which Kiran Desai of the Warje gang and Imran Shaikh of the Kondhwa group extort a shopkeeper together. It is the first document to name both gangs. After the upload the two of them rank as bridges beside Dinesh Deshmukh, and the network shows the gangs working as one.

## Presenting the demo

The seed network is committed, so the demo needs no network access and no LLM key.

1. Briefing. Read the summary sentence aloud: 40 FIRs become 225 linked entities, the network splits into groups, and one person with five connections is the only link between them. Point at the leads: each alert is phrased as the question an investigator would ask.
2. Network. The shaded areas are the groups. Open the go-between lead: Dinesh Deshmukh lights up between the two gangs while everything else fades, and the inspector says he is not named in any FIR.
3. Route tab. Trace phone 9774964990 to Aslam Khan. Three hops from a complainant's phone to the gang leader.
4. Alerts tab. Open a structuring alert and read the evidence: the amounts, the week, and where the money went.
5. Case files. Open FIR-2026-0001. Every highlighted span is an entity the system extracted; click one to jump to it on the network.
6. Add records. Upload backend/data/demo/FIR-2026-0041.txt. Four new entities appear, and the key players now include Kiran Desai and Imran Shaikh as bridges.
7. Restore the demo dataset from the same page before the next run.

## Using it for a new case

The demo dataset is only a starting point. On the Add records page, Start a new investigation empties the workspace. Add the FIRs of the new case as text files, then the call detail records and bank statements as CSV files in the formats shown on the page. Entities with the same phone number, account number, plate or name are matched automatically, so each file adds to the same picture. The Briefing rewrites itself from whatever records are present, and the demo dataset can be restored at any time.

In the MVP the workspace lives in memory and is lost when the backend restarts. Phase 5 moves it to Neo4j so investigations persist.

## Project files

- IMPLEMENTATION_PLAN.md: phased plan for Person A (backend) and Person B (frontend).
- TASKS.md: current status.
