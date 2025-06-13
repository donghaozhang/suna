# Cursor Rules Documentation

## Updated Cursor Rules (January 2025)

This directory contains updated and streamlined cursor rules for the Suna project, incorporating recent changes and improvements based on the upstream merge.

### Files Updated

#### 1. development-workflow.mdc
**Changes**: Split and reorganized with latest infrastructure improvements
- **Split**: Created separate `feature-flags-troubleshooting.mdc` for feature flags and troubleshooting
- **Updated**: Added Unicode filename normalization utilities
- **Added**: Redis retry utilities with exponential backoff
- **Updated**: MCP server improvements and configuration enhancements
- **Added**: Organized test directory structure with documentation
- **Maintained**: Modern Docker syntax and fast development workflow

#### 2. feature-flags-troubleshooting.mdc
**New File**: Comprehensive guide for feature flags and troubleshooting
- **Feature Flag Management**: Redis-based system with CLI commands
- **Troubleshooting Guide**: Common issues including Unicode filename problems
- **Debug Commands**: Service health checks and Redis debugging
- **Performance Optimization**: Frontend and backend optimization tips
- **Testing Guidelines**: Manual testing checklist and quality assurance

#### 3. agent-capabilities.mdc
**Changes**: Updated with infrastructure improvements
- **Added**: Infrastructure & Reliability section
- **Updated**: Redis retry utilities documentation
- **Added**: Unicode file handling capabilities
- **Updated**: MCP server enhancements
- **Enhanced**: FAL media tool with default enablement info

#### 4. project-architecture.mdc
**Changes**: Updated file structure and added infrastructure improvements
- **Updated**: Complete file structure with new utilities and test directories
- **Added**: Recent Infrastructure Improvements section
- **Enhanced**: Redis reliability, Unicode handling, MCP improvements
- **Added**: Testing infrastructure and feature flag system documentation

#### 5. frontend-conventions.mdc  
**Status**: Previously updated (maintained at ~400 lines)

#### 6. backend-conventions.mdc
**Status**: Previously updated (maintained at ~300 lines)

#### 7. database-supabase.mdc
**Status**: Maintained as-is (concise at 411 lines)

#### 8. railway-deployment.mdc
**New File**: Comprehensive Railway deployment rules
- **Service Architecture**: Frontend, Backend, Worker, Redis, RabbitMQ configuration
- **Environment Variables**: Complete configuration for all services
- **Railway CLI Commands**: Project setup, deployment, monitoring, debugging
- **Security Configuration**: Environment security, network security, database security
- **Cost Optimization**: Pricing strategy and resource optimization
- **Production Checklist**: Pre/post deployment verification steps

#### 9. railway-testing.mdc
**New File**: Railway testing strategy and workflow rules
- **Testing Strategy**: Branch-based testing approach with auto-deployment
- **API Testing**: Health checks, authentication, endpoint testing checklists
- **Frontend Testing**: Browser testing workflow and user flow verification
- **Automated Testing**: Node.js testing scripts and integration testing
- **Performance Testing**: Load testing and frontend performance measurement
- **Regression Testing**: API and frontend regression test suites

## Key Improvements Made

### Infrastructure Enhancements
- **Redis Reliability**: New retry utilities with exponential backoff for connection resilience
- **Unicode File Handling**: Cross-platform filename normalization (macOS NFD ↔ Windows/Linux NFC)
- **MCP Server Improvements**: Enhanced configuration interface and error handling
- **Testing Organization**: Structured test directory with comprehensive documentation
- **Feature Flag System**: Redis-based centralized feature management

### Technical Updates
- **Modern Docker**: `docker compose` syntax throughout documentation
- **Organized File Structure**: Updated with new utilities, tests, and infrastructure components
- **Enhanced Tools**: FAL media generation enabled by default for all agents
- **Improved Error Handling**: Better debugging tools and troubleshooting guides
- **Performance Optimization**: Frontend and backend optimization strategies

### Documentation Structure
- **File Split**: Separated troubleshooting into dedicated guide for better organization
- **Comprehensive Troubleshooting**: Common issues with detailed solutions
- **Debug Commands**: Service health checks, Redis debugging, file upload debugging
- **Manual Testing**: Quality assurance checklists and testing guidelines

### Branding & UI/UX (Previously Updated)
- Updated site name from "Kortix Suna" to "Quriosity"
- Updated product name from "Suna" to "Q"
- FlickeringGrid improvements and border cleanup
- Dark mode optimization and consistent styling

## Benefits of Updates

1. **Faster Loading**: Shorter files load faster in cursor
2. **Better Focus**: Essential information is easier to find
3. **Up-to-Date**: Includes recent changes and improvements
4. **Consistent**: Unified approach across all rule files
5. **Practical**: Focuses on actual usage patterns vs. theoretical examples

## Usage Guidelines

These rules are optimized for:
- Quick reference during development
- Essential pattern lookup
- Recent change awareness
- Consistent code generation
- Efficient cursor rule processing

## Recent Changes Covered

### From Upstream Merge
- **Redis Reliability**: New retry utilities with automatic connection recovery
- **Unicode File Handling**: Cross-platform filename normalization for macOS/Windows compatibility
- **MCP Server Improvements**: Enhanced configuration interface and deprecated component cleanup
- **Testing Infrastructure**: Organized `backend/tests/` directory with comprehensive documentation
- **Feature Flag System**: Redis-based centralized feature management with CLI tools
- **FAL Media Tool**: Now enabled by default for all agents (not just "Suna" agent)

### Railway Integration (New)
- **Railway Deployment Rules**: Complete deployment strategy for Railway platform
- **Railway Testing Rules**: Comprehensive testing workflow for Railway deployments
- **API Endpoint Fixes**: Resolved 404 errors with proper `/api` prefix usage
- **Environment Configuration**: Production-ready environment variable setup
- **Monitoring & Debugging**: Railway CLI commands and troubleshooting guides

### Previously Updated
- Docker command syntax modernization (`docker compose` vs `docker-compose`)
- Quriosity branding updates (site name, product name, repository display)
- UI/UX improvements (FlickeringGrid removal, border cleanup, color optimization)
- Homepage component updates and logo system implementation
- Dark mode support patterns and development workflow optimizations 