# GrokBot Changelog

## v0.4.0 - Task System Rebuild & Building Enhancement (2025-03-08)

### Added
- Complete task system rewrite with proper pathfinder integration
- Building command implementation with structure templates:
  - House building with customizable materials
  - Tower construction with proper wall placement
  - Wall building for perimeter protection
- Save state functionality for reliability:
  - Periodic state saving to `grokbot_state.json`
  - Task resumption after disconnects or crashes
  - Detailed changelog tracking via `changelog.txt`
- Autonomous recovery from pathfinding failures
- Stuck detection and self-correction behaviors

### Improved
- Navigation with intelligent path finding and obstacle handling
- Task execution reliability with error recovery
- Building task commands with size parameters
- State persistence across sessions

### Fixed
- Task acknowledgment without execution issue
- Movement failures due to pathfinder integration problems
- Task system initialization and registration

## v0.3.0 - Memory Retention and API Recovery Update (2025-03-08)

### Added
- Enhanced memory system with categorization (places, items, concepts, events, routines)
- New diagnostic commands for memory management:
  - `?memory` - View memory statistics and stored items
  - `?apihealth` - Check API connection status and performance
  - `?remember` - Store information in GrokBot's memory
  - `?recall` - Retrieve information from memory
  - `?help` - View available commands by category
- Process manager for GrokBot with automatic restart capabilities
- System tasks integrated with task architecture:
  - Memory auto-save task with configurable intervals
  - API health monitoring with automatic recovery
- Memory backup system with rotation of older backups
- Windows batch files for easy startup:
  - `start-grokbot-manager.bat` - Launch with process manager
  - `start-grokbot.bat` - Standard launch

### Improved
- Grok API with automatic restart capability when encountering errors
- Command handling with organized command categories
- Error handling and recovery for API failures
- Integration with existing task system architecture
- Memory persistence across restarts

### Fixed
- API failure recovery with exponential backoff
- Memory loss issues when restarting

## v0.2.0 - Building and Crafting Update

### Added
- Comprehensive building capabilities:
  - `buildStructure` task for houses, towers, and walls
  - `placeFurnace` with automatic crafting
  - `placeChest` with automatic crafting
  - `buildFarm` with configurable crop types
- Crafting and processing features:
  - `smeltItems` for processing raw materials
  - Automatic item crafting when prerequisites are missing

### Improved
- Error handling and recovery for building tasks
- Environmental awareness for intelligent placement

## v0.1.0 - Task System Implementation

### Added
- Robust task-based architecture for autonomous operation
- Flexible AI integration with multiple service methods
- Pathfinder integration with error handling and stuck detection
- Task queue management with completion tracking
- Command interface for in-game task interaction:
  - `?goto` - Navigate to coordinates or saved locations
  - `?explore` - Explore surrounding area with configurable radius
  - `?follow` - Follow a player with customizable distance
  - `?stop` - Cancel current tasks and movement
- Timeout safety mechanisms to prevent indefinite task execution

### Improved
- Reduced API calls through intelligent task scheduling
- Fallback behaviors when API is in degraded mode
