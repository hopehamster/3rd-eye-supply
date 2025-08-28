# MCP Servers for 3rd Eye Supply

This project includes several Model Context Protocol (MCP) servers that provide enhanced capabilities for development and content creation.

## Available MCP Servers

### 1. AI Image Generation (`ai-image-gen`)
- **Purpose**: Generate images using Replicate's flux-schnell model
- **Location**: `./ai-image-gen-mcp/`
- **Setup**: 
  - Requires REPLICATE_API_TOKEN environment variable (✅ Configured)
  - Built with TypeScript/Node.js
  - Run `npm run build` to compile

### 2. Blender Integration (`blender-mcp`)
- **Purpose**: Integrate with Blender for 3D modeling and animation
- **Location**: `./blender-mcp/`
- **Setup**: 
  - Python-based server using uv package manager
  - Run `uv sync` to install dependencies

### 3. Unreal Engine Integration (`unreal-mcp`)
- **Purpose**: Integrate with Unreal Engine for game development
- **Location**: `./unreal-mcp/`
- **Setup**: 
  - Python-based server using uv package manager
  - Includes full Unreal Engine project template
  - Run `uv sync` in the Python directory

### 4. Peekaboo (`peekaboo`)
- **Purpose**: macOS-only MCP server for capturing screenshots and visual analysis
- **Package**: `@steipete/peekaboo-mcp`
- **Features**: Advanced screen captures, image analysis, window management
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/peekaboo)

### 5. GitHub Integration (`github`)
- **Purpose**: Integration with GitHub's issue tracking system
- **Package**: `@modelcontextprotocol/server-github`
- **Setup**: Requires GITHUB_PERSONAL_ACCESS_TOKEN environment variable
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/github)

### 6. SQLite Database (`sqlite`)
- **Purpose**: Query and analyze SQLite databases directly
- **Package**: `mcp-server-sqlite-npx`
- **Features**: Comprehensive SQLite database operations
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/sqlite)

### 7. Web Research (`web-research`)
- **Purpose**: Conduct web research using Google search and web scraping
- **Package**: `@mzxrai/mcp-webresearch`
- **Setup**: Requires GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables
- **Features**: Google search integration, web scraping capabilities

### 8. Memory LibSQL (`memory-libsql`)
- **Purpose**: High-performance persistent memory system powered by libSQL
- **Package**: `mcp-memory-libsql`
- **Features**: Vector search, knowledge storage, semantic search
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/memory-libsql)

### 9. TickTick MCP v2 (`ticktick-mcp-v2`)
- **Purpose**: Task management integration with TickTick's v2 API
- **Package**: `ticktick-mcp-v2` (via uvx)
- **Setup**: Requires TICKTICK_USERNAME and TICKTICK_PASSWORD environment variables
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/ticktick-mcp-v2)

### 10. MCP Transcribe (`mcp-transcribe`)
- **Purpose**: Audio transcription services
- **Package**: `github:transcribe-app/mcp-transcribe`
- **Setup**: Requires MCP_INTEGRATION_URL environment variable

### 11. Google Ads by TrueClicks (`google-ads-trueclicks`)
- **Purpose**: Google Ads integration via GAQL.app backend
- **Package**: `@trueclicks/google-ads-mcp-js`
- **Features**: Secure Google Ads account data access, supports Windows/macOS
- **Setup**: Requires GAQL_APP_API_KEY environment variable
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/google-ads-mcp-by-trueclicks)

### 12. Google Drive (`google-drive`)
- **Purpose**: Full Google Drive integration with CRUD operations
- **Package**: `mcp-google-drive`
- **Features**: OAuth2 authentication, file management, sharing capabilities
- **Setup**: Requires GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/google-drive)

### 13. Brave Search (`brave-search`)
- **Purpose**: Web search using Brave's Search API
- **Package**: `@brave/brave-search-mcp-server`
- **Features**: Web search, image search, news search, video search
- **Setup**: Requires BRAVE_API_KEY environment variable
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/brave-search)

### 14. Fetch (`fetch`)
- **Purpose**: Web content fetching and HTML to markdown conversion
- **Package**: `@mokei/mcp-fetch`
- **Features**: Web scraping, content extraction, markdown formatting
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/fetch)

### 15. Google Cloud Platform (`gcp`)
- **Purpose**: GCP resource management through natural language
- **Package**: `@google-cloud/mcp`
- **Features**: GCP environment interaction, resource querying
- **Setup**: Requires GOOGLE_APPLICATION_CREDENTIALS environment variable
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/gcp)

### 16. Knowledge Graph Memory (`knowledge-graph-memory`)
- **Purpose**: Dynamic temporal knowledge graphs using Graphiti framework
- **Package**: `graphiti-mcp`
- **Features**: Incremental interaction integration, efficient queries
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/knowledge-graph-memory-for-agents)

### 17. Facebook Ads Library (`facebook-ads-library`)
- **Purpose**: Facebook Ad Library API integration with AI video analysis
- **Package**: `facebook-ads-library-mcp`
- **Features**: Multi-brand searches, video analysis, SQLite caching
- **Setup**: Requires FACEBOOK_ACCESS_TOKEN, GEMINI_API_KEY environment variables
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/facebook-ads-library-mcp)

### 18. Telegram (`telegram`)
- **Purpose**: Telegram API integration for chat and message management
- **Package**: `@chaindead/telegram-mcp`
- **Features**: User data access, dialog management, message retrieval
- **Setup**: Requires TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION_STRING
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/telegram-mcp)

### 19. Keywords People Use (`keywordspeopleuse`)
- **Purpose**: Keyword research and SEO analysis
- **Package**: `keywordspeopleuse-mcp-server`
- **Setup**: Requires KEYWORDSPEOPLEUSE_API_KEY environment variable
- **Reference**: [Cursor Directory](https://cursor.directory/mcp/keywordspeopleuse-mcp-server)

### 20. Chart AntV (`chart-antv`) ✅ **ZERO-CONFIG**
- **Purpose**: Generate professional charts and data visualizations using AntV
- **Package**: `@antv/mcp-server-chart`
- **Features**: Bar charts, line charts, pie charts, scatter plots, and more
- **Use Cases**: Sales analytics, product performance, customer behavior analysis

### 21. Mermaid Chart (`mermaid-chart`) ✅ **ZERO-CONFIG**
- **Purpose**: Render Mermaid diagrams to high-quality images
- **Package**: `@pickstar-2002/mermaid-chart-mcp`
- **Features**: Flowcharts, sequence diagrams, Gantt charts, class diagrams
- **Use Cases**: Business process documentation, system architecture, workflow visualization

### 22. MCP Mermaid (`mcp-mermaid`) ✅ **ZERO-CONFIG**
- **Purpose**: Generate mermaid diagrams and charts dynamically with AI
- **Package**: `mcp-mermaid`
- **Features**: Dynamic diagram generation, multiple diagram types
- **Use Cases**: Real-time diagram creation, documentation automation

### 23. ECharts (`echarts`) ✅ **ZERO-CONFIG**
- **Purpose**: Generate interactive visual charts using Apache ECharts
- **Package**: `mcp-echarts`
- **Features**: Interactive charts, complex data visualizations, real-time updates
- **Use Cases**: Dashboard creation, data analysis, business intelligence

### 24. Filesystem (`filesystem`) ✅ **ZERO-CONFIG**
- **Purpose**: Secure filesystem access for file operations
- **Package**: `@modelcontextprotocol/server-filesystem`
- **Features**: File reading, writing, directory operations, secure access
- **Use Cases**: Product image management, content organization, file automation

### 25. Playwright (`playwright`) ✅ **ZERO-CONFIG**
- **Purpose**: Web automation and testing tools
- **Package**: `@playwright/mcp`
- **Features**: Browser automation, screenshot capture, performance testing
- **Use Cases**: Website testing, automated monitoring, competitive analysis

### 26. TikTok (`tiktok`) 🚀 **SOCIAL MEDIA POWERHOUSE**
- **Purpose**: TikTok integration for video posting, analytics, and content management
- **Package**: Custom build from `https://github.com/Seym0n/tiktok-mcp`
- **Features**: Video subtitle extraction, post details, video search, trending analysis
- **Setup**: Requires TIKNEURON_MCP_API_KEY from TikNeuron service
- **Use Cases**: 
  - Post product demonstration videos
  - Analyze trending spiritual/wellness content
  - Extract insights from competitor videos
  - Automate TikTok marketing campaigns
  - Track engagement and performance metrics

## Configuration

### Global Configuration
MCP servers are configured globally in `~/.cursor/mcp.json` with absolute paths.

### Local Configuration
Local project configuration is available in `./.cursor/mcp.json` with relative paths.

## Environment Variables

### AI Image Generation
- `REPLICATE_API_TOKEN`: Required for image generation functionality

## Usage

Once configured, these MCP servers will be available in Cursor for:
- Generating images for your projects
- Creating and manipulating 3D models in Blender
- Integrating with Unreal Engine for game development

## Troubleshooting

1. Ensure all dependencies are installed (`npm install`, `uv sync`)
2. Check that environment variables are properly set
3. Verify paths in MCP configuration files are correct
4. Restart Cursor after making configuration changes
