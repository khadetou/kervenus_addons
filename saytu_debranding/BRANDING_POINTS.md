# Complete List of Odoo Branding Points

This document provides a comprehensive list of all Odoo branding points identified in Odoo 19 Community Edition and how they are handled by the Saytu Debranding module.

## ✅ Fully Debranded (Handled by Module)

### 1. Page Title
**Location**: `addons/web/views/webclient_templates.xml` (line 22)  
**Original**: `<title t-esc="title or 'Odoo'"/>`  
**Modified**: `<title t-esc="title or 'Saytu'"/>`  
**How**: Template inheritance in `views/webclient_templates.xml`  
**Status**: ✅ Complete

### 2. Login Page Footer
**Location**: `addons/web/views/webclient_templates.xml` (line 128)  
**Original**: `<a href="https://www.odoo.com?utm_source=db&utm_medium=auth" target="_blank">Powered by <span>Odoo</span></a>`  
**Modified**: `<span class="text-muted">Powered by Saytu</span>`  
**How**: XPath replacement in `views/webclient_templates.xml`  
**Status**: ✅ Complete

### 3. Brand Promotion Message
**Location**: `addons/web/views/webclient_templates.xml` (lines 87-100)  
**Original**: "Powered by Odoo" with logo and link to odoo.com  
**Modified**: "Powered by Saytu" text badge  
**How**: Template inheritance in `views/webclient_templates.xml`  
**Status**: ✅ Complete

### 4. User Menu - "My Odoo.com Account"
**Location**: `addons/web/static/src/webclient/user_menu/user_menu_items.js` (lines 72-88)  
**Original**: Menu item "My Odoo.com Account" linking to https://accounts.odoo.com/account  
**Modified**: Menu item removed completely  
**How**: JavaScript registry removal in `static/src/webclient/user_menu_items.js`  
**Status**: ✅ Complete

### 5. Error Dialog Titles - Server Error
**Location**: `addons/web/static/src/core/errors/error_dialogs.js` (line 124)  
**Original**: `this.title = _t("Odoo Server Error");`  
**Modified**: `this.title = _t("Saytu Server Error");`  
**How**: JavaScript patch in `static/src/webclient/error_dialogs.js`  
**Status**: ✅ Complete

### 6. Error Dialog Titles - Client Error
**Location**: `addons/web/static/src/core/errors/error_dialogs.js` (line 127)  
**Original**: `this.title = _t("Odoo Client Error");`  
**Modified**: `this.title = _t("Saytu Client Error");`  
**How**: JavaScript patch in `static/src/webclient/error_dialogs.js`  
**Status**: ✅ Complete

### 7. Error Dialog Titles - Network Error
**Location**: `addons/web/static/src/core/errors/error_dialogs.js` (line 130)  
**Original**: `this.title = _t("Odoo Network Error");`  
**Modified**: `this.title = _t("Saytu Network Error");`  
**How**: JavaScript patch in `static/src/webclient/error_dialogs.js`  
**Status**: ✅ Complete

### 8. Frontend Layout Logo Alt Text
**Location**: `addons/web/views/webclient_templates.xml`  
**Original**: `<img alt="Logo" .../>`  
**Modified**: `<img alt="Saytu" .../>`  
**How**: XPath attribute modification in `views/webclient_templates.xml`  
**Status**: ✅ Complete

## ⚠️ Partially Debranded (Requires Manual Intervention)

### 9. Database Manager Page Title
**Location**: `addons/web/static/src/public/database_manager.qweb.html` (line 4)  
**Original**: `<title>Odoo</title>`  
**Modified**: Requires manual edit or custom controller  
**How**: Static HTML file - cannot be inherited  
**Status**: ⚠️ Partial - See README for manual steps

### 10. Database Manager Logo
**Location**: `addons/web/static/src/public/database_manager.qweb.html` (line 33)  
**Original**: `<img src="/web/static/img/logo2.png" .../>`  
**Modified**: Requires manual edit or custom controller  
**How**: Static HTML file - cannot be inherited  
**Status**: ⚠️ Partial - See README for manual steps

### 11. Database Manager Warning Text
**Location**: `addons/web/static/src/public/database_manager.qweb.html` (line 39)  
**Original**: "Warning, your Odoo database manager is not protected."  
**Modified**: Requires manual edit or custom controller  
**How**: Static HTML file - cannot be inherited  
**Status**: ⚠️ Partial - See README for manual steps

### 12. Database Manager Privacy Policy Link
**Location**: `addons/web/static/src/public/database_manager.qweb.html` (line 108)  
**Original**: `<a href="https://www.odoo.com/privacy" target="_blank">Privacy Policy</a>`  
**Modified**: Requires manual edit or custom controller  
**How**: Static HTML file - cannot be inherited  
**Status**: ⚠️ Partial - See README for manual steps

### 13. Database Manager URL Pattern
**Location**: `addons/web/static/src/public/database_manager.qweb.html` (line 51)  
**Original**: `<a t-attf-href="/odoo?db={{ db }}" ...>`  
**Modified**: Requires manual edit or custom controller  
**How**: Static HTML file - cannot be inherited  
**Status**: ⚠️ Partial - See README for manual steps

## ❌ Not Debranded (Out of Scope)

### 14. Internal Code Comments
**Location**: Throughout codebase  
**Example**: `# This is an Odoo module`  
**Reason**: Internal documentation, not user-facing  
**Status**: ❌ Out of scope

### 15. Python Package Name
**Location**: Python imports  
**Example**: `from odoo import models, fields, api`  
**Reason**: Core framework name, cannot be changed  
**Status**: ❌ Out of scope

### 16. Module Technical Names
**Location**: Module directories and imports  
**Example**: `odoo.addons.base`, `odoo.addons.web`  
**Reason**: Core framework structure, cannot be changed  
**Status**: ❌ Out of scope

### 17. Database Table Prefixes
**Location**: PostgreSQL database  
**Example**: Table names like `ir_model`, `res_users`  
**Reason**: Core database structure, not user-facing  
**Status**: ❌ Out of scope

### 18. API Endpoints
**Location**: HTTP routes  
**Example**: `/web/session/account`, `/odoo`  
**Reason**: Core routing, changing would break functionality  
**Status**: ❌ Out of scope

### 19. Configuration File
**Location**: `odoo.conf`  
**Example**: `[options]` section  
**Reason**: Server configuration, not user-facing  
**Status**: ❌ Out of scope

### 20. Log Messages
**Location**: Server logs  
**Example**: "Odoo server started"  
**Reason**: Internal logging, not user-facing  
**Status**: ❌ Out of scope

## 📊 Summary Statistics

| Category | Count | Percentage |
|----------|-------|------------|
| ✅ Fully Debranded | 8 | 40% |
| ⚠️ Partially Debranded | 5 | 25% |
| ❌ Not Debranded (Out of Scope) | 7 | 35% |
| **Total Identified** | **20** | **100%** |

## 🎯 User-Facing Branding Coverage

When considering only **user-facing** branding (excluding internal code, logs, etc.):

| Category | Count | Percentage |
|----------|-------|------------|
| ✅ Fully Debranded | 8 | 62% |
| ⚠️ Partially Debranded | 5 | 38% |
| **Total User-Facing** | **13** | **100%** |

## 📝 Notes

### Database Manager Debranding

The database manager page is a static HTML file that cannot be inherited using Odoo's standard inheritance mechanisms. To fully debrand it, you have two options:

1. **Manual Edit** (Not recommended):
   - Edit `addons/web/static/src/public/database_manager.qweb.html` directly
   - Changes will be lost on Odoo updates

2. **Custom Controller** (Recommended):
   - Create a custom controller that serves a modified version
   - More complex but safer and maintainable
   - See `CUSTOMIZATION_GUIDE.md` for details

### Translation Considerations

All user-facing text changes use Odoo's translation system (`_t()` function), which means:
- Text can be translated to other languages
- Translations need to be updated in PO files if you change the brand name
- The module includes English translations by default

### Future Odoo Updates

When Odoo is updated:
- ✅ Template inheritance will continue to work
- ✅ JavaScript patches will continue to work
- ⚠️ New branding points may be introduced
- ⚠️ Manual edits to core files will be lost

## 🔍 How to Find Additional Branding

If you discover additional Odoo branding not covered by this module:

1. **Search the codebase**:
   ```bash
   grep -r "Odoo" addons/web/
   grep -r "odoo.com" addons/web/
   ```

2. **Check browser console**:
   - Open Developer Tools (F12)
   - Look for "Odoo" in console messages

3. **Inspect HTML elements**:
   - Right-click → Inspect Element
   - Search for "Odoo" in the HTML

4. **Check network requests**:
   - Open Developer Tools (F12) → Network tab
   - Look for requests to odoo.com

## 📧 Reporting Missing Branding

If you find Odoo branding that should be removed:

1. Note the exact location (file and line number)
2. Note what the branding says
3. Note where it appears in the UI
4. Create an issue or contact support

---

**Last Updated**: 2025-11-11  
**Module Version**: 19.0.1.0.0

