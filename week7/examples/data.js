window.W7 = {
  "t1": {
    "run": "r1",
    "cols": [
      "gt",
      "opus",
      "astra",
      "opus_text",
      "astra_text"
    ],
    "cases": [
      {
        "id": "C1_combat",
        "label": "fight only, no talking",
        "pass": {
          "opus": true,
          "astra": true,
          "opus_text": true,
          "astra_text": true,
          "lower": true
        }
      },
      {
        "id": "C2_about_natural",
        "label": "approach, read, pick option 1",
        "pass": {
          "opus": false,
          "astra": true,
          "opus_text": false,
          "astra_text": false,
          "lower": false
        }
      },
      {
        "id": "C3_goodbye_skip",
        "label": "skip typing, option 2",
        "pass": {
          "opus": false,
          "astra": true,
          "opus_text": false,
          "astra_text": false,
          "lower": false
        }
      },
      {
        "id": "C4_illegal_entry",
        "label": "E too far / dead opponent",
        "pass": {
          "opus": true,
          "astra": true,
          "opus_text": true,
          "astra_text": true,
          "lower": true
        }
      },
      {
        "id": "C5_cancel_reopen",
        "label": "Esc mid dialogue, reopen",
        "pass": {
          "opus": false,
          "astra": true,
          "opus_text": false,
          "astra_text": false,
          "lower": false
        }
      },
      {
        "id": "C6_below_wait_bullets",
        "label": "wait under fire, then talk",
        "pass": {
          "opus": false,
          "astra": true,
          "opus_text": false,
          "astra_text": false,
          "lower": false
        }
      },
      {
        "id": "C7_held_keys",
        "label": "keys held through dialogue",
        "pass": {
          "opus": false,
          "astra": true,
          "opus_text": false,
          "astra_text": false,
          "lower": false
        }
      },
      {
        "id": "C8_spam_and_reset",
        "label": "spam E, R mid dialogue",
        "pass": {
          "opus": false,
          "astra": true,
          "opus_text": false,
          "astra_text": false,
          "lower": false
        }
      },
      {
        "id": "C9_radius_probe",
        "label": "probe talk radius",
        "pass": {
          "opus": true,
          "astra": true,
          "opus_text": false,
          "astra_text": false,
          "lower": false
        }
      }
    ],
    "runs": {
      "opus": {
        "minutes": 6.8,
        "added": 277,
        "removed": 3,
        "base_unchanged": true
      },
      "astra": {
        "minutes": 13.9,
        "added": 506,
        "removed": 6,
        "base_unchanged": true
      },
      "opus_text": {
        "minutes": 2.7,
        "added": 374,
        "removed": 4,
        "base_unchanged": true
      },
      "astra_text": {
        "minutes": 6.2,
        "added": 471,
        "removed": 6,
        "base_unchanged": true
      }
    },
    "summary": {
      "opus": {
        "exact": 3,
        "cases": 9,
        "flow": 3,
        "shooter": 1,
        "dialogue": 0.938074246451461
      },
      "astra": {
        "exact": 9,
        "cases": 9,
        "flow": 9,
        "shooter": 1,
        "dialogue": 1
      },
      "opus_text": {
        "exact": 2,
        "cases": 9,
        "flow": 2,
        "shooter": 0.9106423272356758,
        "dialogue": 0.7759960537866357
      },
      "astra_text": {
        "exact": 2,
        "cases": 9,
        "flow": 2,
        "shooter": 0.9106423272356758,
        "dialogue": 0.7759960537866357
      },
      "lower": {
        "exact": 2,
        "cases": 9,
        "flow": 2,
        "shooter": 0.6980174355673202,
        "dialogue": 0.7896454349156833
      }
    }
  },
  "t3": {
    "run": "e2-r3",
    "cols": [
      "gt",
      "opus",
      "astra"
    ],
    "cases": [
      {
        "id": "R1_walk_off_star",
        "label": "fall, bounce, 2 portals, star",
        "pass": {
          "opus": false,
          "astra": true,
          "lower": false
        }
      },
      {
        "id": "R2_walk_off_miss",
        "label": "fall, bounce, miss portal",
        "pass": {
          "opus": false,
          "astra": true,
          "lower": false
        }
      },
      {
        "id": "R3_jump_off_left",
        "label": "jump in, steer left",
        "pass": {
          "opus": false,
          "astra": true,
          "lower": false
        }
      },
      {
        "id": "R4_ground_hop",
        "label": "hop from ground (weak bounce)",
        "pass": {
          "opus": false,
          "astra": true,
          "lower": false
        }
      },
      {
        "id": "R5_ground_hop_edge",
        "label": "hop onto pad edge",
        "pass": {
          "opus": false,
          "astra": true,
          "lower": false
        }
      },
      {
        "id": "R6_locked_inputs",
        "label": "press keys while charging",
        "pass": {
          "opus": false,
          "astra": true,
          "lower": false
        }
      },
      {
        "id": "R7_reset_mid",
        "label": "R while charging",
        "pass": {
          "opus": false,
          "astra": true,
          "lower": false
        }
      },
      {
        "id": "R8_star_then_down",
        "label": "star, then drop into top portal",
        "pass": {
          "opus": false,
          "astra": true,
          "lower": false
        }
      },
      {
        "id": "R9_late_left",
        "label": "late fall, steer left",
        "pass": {
          "opus": false,
          "astra": true,
          "lower": false
        }
      }
    ],
    "runs": {
      "opus": {
        "minutes": 8.6,
        "added": 222,
        "removed": 3,
        "base_unchanged": true
      },
      "astra": {
        "minutes": 11.4,
        "added": 312,
        "removed": 5,
        "base_unchanged": true
      }
    },
    "summary": {
      "opus": {
        "exact": 0,
        "cases": 9,
        "pos_err": 0.22720219075573,
        "counts": 9,
        "end": 9
      },
      "astra": {
        "exact": 9,
        "cases": 9,
        "pos_err": 0,
        "counts": 9,
        "end": 9
      },
      "lower": {
        "exact": 0,
        "cases": 9,
        "pos_err": 278.07806977499945,
        "counts": 0,
        "end": 0
      }
    }
  }
};
