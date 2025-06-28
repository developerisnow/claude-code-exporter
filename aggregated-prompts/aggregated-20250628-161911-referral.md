# Aggregated Prompts for referral

**Project**: `/Users/user///Repositories/HypeTrain/repositories/hypetrain/backend/referral`
**Sessions**: 8
**Total Prompts**: 8
**Date Range**: 6/26/2025 to 6/26/2025

## Session: 432a03dd-be27-476e-b464-1e171f10084a (6/26/2025)

### Prompt 1 - 6/26/2025, 10:00:07 PM

```
You are the Lead Orchestrator Agent for reviewing the Referral System feature (PR #888).

Your role is to:
1. Decompose the review into subtasks for specialized agents
2. Coordinate parallel execution of agents
3. Aggregate results from all agents
4. Produce final comprehensive review

CONTEXT:
- PR #888: https://github.com/infludb-inc/hypetrain-backend/pull/888
- Developer: Vadim Prizigoda
- Feature: Internal Referral Program
- Files changed: 79 files, +1440 lines, -73 lines

YOUR WORKFLOW:
1. Create detailed task descriptions for each specialized agent
2. Monitor their progress via checkpoint files
3. Aggregate their findings into a final report
4. Identify critical issues that need immediate fixes
5. Create action plan for fixes in separate branch

Output your orchestration plan as JSON to orchestrator-plan.json
```


---

## Session: abcd958a-dfd5-4764-92eb-d0fe6eb481ab (6/26/2025)

### Prompt 1 - 6/26/2025, 10:00:09 PM

```
Analyze PR #888 for code quality issues:

FOCUS AREAS:
- DDD violations in referral domain model
- CQRS pattern compliance
- Error handling patterns
- Code duplication
- SOLID principles adherence

SPECIFIC FILES TO CHECK:
- domain/referral/models/referral-bonus.model.ts
- application/referral/queries/handlers/
- infrastructure/modules/referral/

OUTPUT:
Create detailed report with:
- Severity levels (Critical/High/Medium/Low)
- Specific line numbers
- Fix suggestions
- Code examples

Save as JSON to results/code-quality-analysis.json
```


---

## Session: ff7c2eaa-6e2b-48b4-9b8c-453e66be0742 (6/26/2025)

### Prompt 1 - 6/26/2025, 10:00:10 PM

```
Review Referral System architecture:

ANALYZE:
- Integration with existing subscription system
- Event flow for bonus activation
- Database schema design
- API design patterns
- Separation of concerns

KEY QUESTIONS:
- How does referral integrate with Stripe webhooks?
- Is the bonus calculation in the right layer?
- Are domain events properly implemented?
- Transaction boundaries correct?

Output comprehensive architecture review to results/architecture-analysis.json
```


---

## Session: 4d66337d-d33b-4b58-91c2-42a3927f068c (6/26/2025)

### Prompt 1 - 6/26/2025, 10:00:11 PM

```
Validate business logic implementation:

REQUIREMENTS FROM FIBERY #512:
- Referrer gets 100 tokens when referee pays
- Referee gets 30% bonus on first purchase only
- Bonuses apply to workspace, not individual user
- Referral link is static per workspace
- No multi-level or abuse scenarios

CHECK:
- Correct bonus calculations (30% for referee, 100 for referrer)
- One-time bonus enforcement
- Workspace-level token management
- Edge cases handling

Output validation report to results/business-logic-validation.json
```


---

## Session: 3c1d3766-de3f-46e6-996a-c42854a9f9c3 (6/26/2025)

### Prompt 1 - 6/26/2025, 10:00:12 PM

```
Perform security audit on Referral System:

CHECK FOR:
- Referral code validation
- Authorization checks on bonus endpoints
- SQL injection in queries
- Rate limiting on referral registration
- Potential abuse vectors
- Token manipulation risks

SPECIFIC CONCERNS:
- Can users self-refer?
- Are bonuses properly locked during refund period?
- Is referral history protected?

Output security findings to results/security-audit.json
```


---

## Session: 746c23ae-2b06-43f3-ae21-3979ac0f7642 (6/26/2025)

### Prompt 1 - 6/26/2025, 10:00:13 PM

```
Analyze test coverage for Referral feature:

REQUIRED TESTS:
- Unit tests for bonus calculations
- Integration tests for Stripe webhook flow
- E2E tests for referral registration
- Edge case coverage

CHECK:
- Are critical paths tested?
- Mock strategies appropriate?
- Test data realistic?
- Performance tests needed?

List missing tests and create test plan in results/test-coverage-analysis.json
```


---

## Session: b0bc8887-5b81-408a-b0b2-57dbc22056fc (6/26/2025)

### Prompt 1 - 6/26/2025, 10:00:14 PM

```
Analyze performance implications:

FOCUS ON:
- Database queries efficiency
- N+1 query problems
- Bulk operations handling
- Cache usage opportunities
- Index requirements

SPECIFIC CHECKS:
- getReferralBonusHistory query performance
- Workspace lookup optimization
- Transaction performance impact

Output performance recommendations to results/performance-analysis.json
```


---

## Session: 1ecbba5c-bf04-49e2-9feb-7b09fae21d64 (6/26/2025)

### Prompt 1 - 6/26/2025, 10:00:16 PM

```
Review documentation and API contracts:

CHECK:
- API documentation completeness
- DTO validation rules
- Error response formats
- Migration rollback procedures
- README updates

MISSING:
- Deployment instructions?
- Configuration parameters?
- Monitoring setup?

Output documentation gaps to results/documentation-review.json
```


---

