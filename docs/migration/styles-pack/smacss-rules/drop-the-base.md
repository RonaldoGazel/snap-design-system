# Drop the Base
As projects grow, relying too heavily on base element styles (global resets) can lead to unwanted side effects. This chapter explores transitioning to a "Module-first" approach.

## Key Concepts
- **Reducing Global Styles:** Minimize styles applied directly to elements like `h1`, `p`, or `ul`.
- **Class-Based Styling:** Instead of styling a `table` globally, create a `.table` module to prevent conflicts with specialized components.
- **Reset vs. Normalize:** SMACSS leans towards a minimal reset, ensuring the Base layer only handles fundamental, project-wide defaults.
