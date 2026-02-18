# Contributing

We welcome contributions to ArthaPage! This document outlines the process for submitting improvements and bug fixes.

## Development Workflow

1.  **Fork the Repository**: Create your own copy of the project.
2.  **Clone Locally**:
    ```bash
    git clone https://github.com/Start-Up-code/First-Web-Extension.git
    cd First-Web-Extension
    ```
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Create a New Branch**:
    ```bash
    git checkout -b feature/your-feature-name
    ```

## Code Standards

-   **Linting**: Run `npm run lint` before committing to ensure code quality.
-   **Structure**: Keep components modular and placed within the appropriate directories (`src/components`, `src/lib`, etc.).
-   **Testing**: Manually verify changes by reloading the extension in the browser. Pay attention to styling across different websites due to Shadow DOM isolation.

## Pull Request Process

1.  Push your changes to your fork.
2.  Submit a Pull Request (PR) to the `main` branch.
3.  Provide a clear description of the problem solved or feature added.
4.  Reference any relevant issues.

## Reporting Issues

If you encounter bugs or have feature requests, please use the GitHub Issues tab. Provide as much detail as possible, including browser version and steps to reproduce.

