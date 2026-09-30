/** Verified event tables with explicit emulator supplements; see SOURCE_NOTES.md. */
const DATA = {
  "rune-knight": {
    "id": "rune-knight",
    "events": {
      "STR": [
        10,
        11,
        33,
        51,
        60,
        70
      ],
      "AGI": [
        20,
        21,
        41,
        53,
        63,
        68
      ],
      "VIT": [
        4,
        14,
        23,
        32,
        45,
        59,
        61
      ],
      "INT": [
        1,
        2,
        5,
        12,
        13,
        22,
        30,
        39,
        46,
        50
      ],
      "DEX": [
        3,
        15,
        19,
        24,
        31,
        40,
        44,
        55,
        66
      ],
      "LUK": [
        47,
        48,
        49,
        57,
        65
      ]
    },
    "maxJob": 70,
    "sourceNote": "ตารางโบนัสตรงกับ iRO Wiki และ rAthena ที่ตรวจเทียบ",
    "sourceUrls": [
      "https://irowiki.org/wiki/Rune_Knight#Job_Bonuses",
      "https://github.com/rathena/rathena/blob/e985006171d2eb320ee512a653f4c83aea3d81b6/db/re/job_stats.yml#L2936-L3040"
    ],
    "maxTotals": {
      "STR": 6,
      "AGI": 6,
      "VIT": 7,
      "INT": 10,
      "DEX": 9,
      "LUK": 5
    },
    "sourceDetails": "All increment events match iRO Wiki."
  },
  "assassin-cross": {
    "id": "assassin-cross",
    "events": {
      "STR": [
        2,
        7,
        12,
        21,
        29,
        38,
        50,
        54,
        66
      ],
      "AGI": [
        1,
        4,
        5,
        15,
        20,
        24,
        25,
        31,
        32,
        33,
        42,
        46,
        51,
        56,
        62
      ],
      "VIT": [
        9,
        47,
        69
      ],
      "INT": [],
      "DEX": [
        10,
        23,
        37,
        39,
        43,
        53,
        57,
        61,
        64,
        70
      ],
      "LUK": [
        3,
        8,
        16,
        18,
        26,
        34,
        48,
        65
      ]
    },
    "maxJob": 70,
    "sourceNote": "DEX/LUK/INT ตรงกับ Wiki; AGI แรกใช้ Job 1 ตาม rAthena ต่างจาก Wiki ที่ระบุ Job 3 (ไม่กระทบสูตรคราฟต์)",
    "sourceUrls": [
      "https://irowiki.org/wiki/Assassin_Cross#Job_Bonuses",
      "https://github.com/rathena/rathena/blob/e985006171d2eb320ee512a653f4c83aea3d81b6/db/re/job_stats.yml#L1918-L2013"
    ],
    "maxTotals": {
      "STR": 9,
      "AGI": 15,
      "VIT": 3,
      "INT": 0,
      "DEX": 10,
      "LUK": 8
    },
    "sourceDetails": "Craft-relevant INT/DEX/LUK exactly match Wiki. AGI first event differs: Wiki says Job3 (also LUK3); rAthena Job1. Uses rAthena AGI1, explicit unresolved Wiki discrepancy."
  },
  "guillotine-cross": {
    "id": "guillotine-cross",
    "events": {
      "STR": [
        4,
        5,
        9,
        16,
        20,
        30,
        52,
        58
      ],
      "AGI": [
        1,
        10,
        23,
        24,
        35,
        43,
        44,
        53,
        60,
        65,
        70
      ],
      "VIT": [
        14,
        15,
        19,
        31,
        42,
        54
      ],
      "INT": [
        28,
        29,
        41,
        48,
        56
      ],
      "DEX": [
        2,
        11,
        25,
        36,
        37,
        49,
        50,
        62,
        67
      ],
      "LUK": [
        51,
        59,
        64,
        69
      ]
    },
    "maxJob": 70,
    "sourceNote": "Wiki มีถึง Job 65; โบนัสหลังจากนั้นเสริมจาก rAthena ที่ pin commit ยังไม่ยืนยันบน iRO จริง",
    "sourceUrls": [
      "https://irowiki.org/wiki/Guillotine_Cross#Job_Bonuses",
      "https://github.com/rathena/rathena/blob/e985006171d2eb320ee512a653f4c83aea3d81b6/db/re/job_stats.yml#L3415-L3510"
    ],
    "maxTotals": {
      "STR": 8,
      "AGI": 11,
      "VIT": 6,
      "INT": 5,
      "DEX": 9,
      "LUK": 4
    },
    "sourceDetails": "Wiki detailed table stops65. Events67DEX/69LUK/70AGI supplied from pinned rAthena Renewal, not live-iRO verified. Existing Wiki events match."
  },
  "alchemist": {
    "id": "alchemist",
    "events": {
      "STR": [
        6,
        15,
        26,
        34,
        43
      ],
      "AGI": [
        11,
        14,
        40,
        45,
        49,
        50
      ],
      "VIT": [
        20,
        31,
        36
      ],
      "INT": [
        1,
        9,
        17,
        23,
        24,
        29,
        38
      ],
      "DEX": [
        2,
        3,
        8,
        13,
        19,
        21,
        25,
        28,
        32
      ],
      "LUK": []
    },
    "maxJob": 50,
    "sourceNote": "ตารางโบนัสตรงกับ iRO Wiki และ rAthena ที่ตรวจเทียบ",
    "sourceUrls": [
      "https://irowiki.org/wiki/Alchemist#Job_Bonuses",
      "https://github.com/rathena/rathena/blob/e985006171d2eb320ee512a653f4c83aea3d81b6/db/re/job_stats.yml#L1043-L1110"
    ],
    "maxTotals": {
      "STR": 5,
      "AGI": 6,
      "VIT": 3,
      "INT": 7,
      "DEX": 9,
      "LUK": 0
    },
    "sourceDetails": "All increment events match iRO Wiki."
  },
  "creator": {
    "id": "creator",
    "events": {
      "STR": [
        6,
        31,
        53,
        66
      ],
      "AGI": [
        5,
        18,
        27,
        38,
        54,
        67
      ],
      "VIT": [
        9,
        33,
        61
      ],
      "INT": [
        7,
        13,
        22,
        30,
        46,
        59,
        68
      ],
      "DEX": [
        1,
        10,
        15,
        23,
        35,
        41,
        42,
        43,
        47,
        49,
        56,
        57,
        63,
        70
      ],
      "LUK": [
        3,
        8,
        20,
        25,
        34,
        45,
        51,
        52,
        60,
        64,
        69
      ]
    },
    "maxJob": 70,
    "sourceNote": "ใช้ตาราง Biochemist (Creator) ที่ตรงกับ iRO Wiki และ rAthena",
    "sourceUrls": [
      "https://irowiki.org/wiki/Biochemist#Job_Bonuses",
      "https://github.com/rathena/rathena/blob/e985006171d2eb320ee512a653f4c83aea3d81b6/db/re/job_stats.yml#L2401-L2500"
    ],
    "maxTotals": {
      "STR": 4,
      "AGI": 6,
      "VIT": 3,
      "INT": 7,
      "DEX": 14,
      "LUK": 11
    },
    "sourceDetails": "All increment events match iRO Wiki Biochemist; Creator is alternate class name."
  },
  "genetic": {
    "id": "genetic",
    "events": {
      "STR": [
        34,
        51,
        56,
        62,
        67
      ],
      "AGI": [
        8,
        20,
        29,
        40,
        47,
        55
      ],
      "VIT": [
        15,
        18,
        24,
        25,
        52,
        57,
        64,
        69
      ],
      "INT": [
        1,
        2,
        7,
        12,
        23,
        35,
        36,
        41,
        44,
        45,
        50,
        60
      ],
      "DEX": [
        3,
        6,
        13,
        19,
        28,
        39,
        53,
        59
      ],
      "LUK": [
        31,
        58,
        61,
        66
      ]
    },
    "maxJob": 70,
    "sourceNote": "Wiki มีถึง Job 60; โบนัสหลังจากนั้นเสริมจาก rAthena ที่ pin commit ยังไม่ยืนยันบน iRO จริง",
    "sourceUrls": [
      "https://irowiki.org/wiki/Geneticist#Job_Bonuses",
      "https://github.com/rathena/rathena/blob/e985006171d2eb320ee512a653f4c83aea3d81b6/db/re/job_stats.yml#L3986-L4090"
    ],
    "maxTotals": {
      "STR": 5,
      "AGI": 6,
      "VIT": 8,
      "INT": 12,
      "DEX": 8,
      "LUK": 4
    },
    "sourceDetails": "Wiki table stops60; infobox reflects65 totals. Events61LUK/62STR/64VIT/66LUK/67STR/69VIT supplied from pinned rAthena Renewal, not live-iRO verified. Existing Wiki events match."
  }
};
for(const entry of Object.values(DATA)){
  for(const levels of Object.values(entry.events)) Object.freeze(levels);
  Object.freeze(entry.events);Object.freeze(entry.sourceUrls);Object.freeze(entry.maxTotals);Object.freeze(entry);
}
export const JOB_BONUS_DATA=Object.freeze(DATA);
