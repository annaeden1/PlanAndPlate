# Project: PlanAndPlate Calorie Engine Review and Test

## Architecture
- React Client (`client/`)
- Express Server (`services/` or `server/`)
- MongoDB for users/stats
- Spoonacular API for meal generation

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Review Calorie Logic | `calorieCalculator.ts`, `bodyStats`, goal rules | none | DONE |
| 2 | Live Full-Stack Test | API-level test using axios, simulate onboarding APIs, log Spoonacular targetCalories | M1 | DONE |

## Interface Contracts
### Client ↔ Server
- API for onboarding and bodyStats.
### Server ↔ Spoonacular
- Spoonacular API call for meal plans must include `targetCalories` calculated from user bodyStats.

## Code Layout
- `client/`
- `services/`
