# Research Data Schema & Export Formats

## 1. JSON Export Schema (`ExperimentSession`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ExperimentSession",
  "type": "object",
  "required": [
    "schemaVersion",
    "sessionId",
    "participantId",
    "conditionOrder",
    "startedAt",
    "trials",
    "workloadRatings"
  ],
  "properties": {
    "schemaVersion": { "type": "string", "example": "1.0.0" },
    "sessionId": { "type": "string", "example": "S_1730283920_P_01" },
    "participantId": { "type": "string", "example": "P_01" },
    "appVersion": { "type": "string", "example": "0.1.0" },
    "sonificationVersion": { "type": "string", "example": "1.0.0" },
    "conditionOrder": {
      "type": "array",
      "items": { "type": "string", "enum": ["condition_a_speech", "condition_b_non_spatial", "condition_c_spatial"] }
    },
    "currentPhase": { "type": "string" },
    "startedAt": { "type": "number" },
    "completedAt": { "type": "number" },
    "trials": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["trialId", "blockIndex", "condition", "task", "submission", "evaluation", "durationMs", "navigationLog"],
        "properties": {
          "trialId": { "type": "string" },
          "blockIndex": { "type": "number" },
          "trialIndexInBlock": { "type": "number" },
          "condition": { "type": "string" },
          "graphId": { "type": "string" },
          "durationMs": { "type": "number" },
          "replayCount": { "type": "number" },
          "inspectionCount": { "type": "number" },
          "backtrackCount": { "type": "number" },
          "traversalCount": { "type": "number" },
          "evaluation": {
            "type": "object",
            "properties": {
              "isCorrect": { "type": "boolean" },
              "score": { "type": "number" },
              "expectedAnswer": {},
              "actualAnswer": {}
            }
          },
          "navigationLog": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "actionType": { "type": "string" },
                "timestamp": { "type": "number" },
                "monotonicOffsetMs": { "type": "number" },
                "currentNodeId": { "type": "string" },
                "direction": { "type": "string" }
              }
            }
          }
        }
      }
    },
    "workloadRatings": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "mentalDemand": { "type": "number" },
          "physicalDemand": { "type": "number" },
          "temporalDemand": { "type": "number" },
          "performance": { "type": "number" },
          "effort": { "type": "number" },
          "frustration": { "type": "number" },
          "comments": { "type": "string" }
        }
      }
    }
  }
}
```

---

## 2. CSV Summary Schema

The trial-level CSV export provides the following columns for statistical analysis in R, Python, SPSS, or Pandas:

| Column | Type | Description |
| :--- | :--- | :--- |
| `participantId` | string | Anonymous participant identifier (e.g., `P_01`) |
| `sessionId` | string | Unique experiment session identifier |
| `blockIndex` | integer | Index of condition block (0, 1, 2) |
| `trialIndexInBlock` | integer | Index of task within block (0 to 4) |
| `condition` | string | `condition_a_speech` \| `condition_b_non_spatial` \| `condition_c_spatial` |
| `graphId` | string | Identifier of tested graph |
| `taskId` | string | Task identifier |
| `taskType` | string | `branch_identification` \| `convergence_identification` \| `reachability` \| `cycle_identification` \| `mental_model_reconstruction` |
| `isTraining` | boolean | `true` if practice trial, `false` if scored trial |
| `isCorrect` | boolean | Binary correctness outcome |
| `score` | float | Accuracy score (0.0 to 1.0; F1 score for reconstruction) |
| `durationMs` | float | Monotonic exploration duration in milliseconds |
| `actionCount` | integer | Total navigation steps executed during trial |
| `replayCount` | integer | Number of audio replay requests ($R$) |
| `inspectionCount` | integer | Number of exact node inspections ($I$) |
| `backtrackCount` | integer | Number of history backtracks |
| `traversalCount` | integer | Number of edge traversals into neighbors |
| `mentalDemand` | integer | NASA-TLX Mental Demand (1–10) |
| `physicalDemand` | integer | NASA-TLX Physical Demand (1–10) |
| `temporalDemand` | integer | NASA-TLX Temporal Demand (1–10) |
| `performance` | integer | NASA-TLX Perceived Performance (1–10) |
| `effort` | integer | NASA-TLX Required Effort (1–10) |
| `frustration` | integer | NASA-TLX Frustration (1–10) |
| `startTimestamp` | integer | Epoch milliseconds start |
| `endTimestamp` | integer | Epoch milliseconds end |
