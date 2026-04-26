# Customization Guide - Saytu Debranding Module

This guide explains how to customize the Saytu Debranding module to use a different brand name or add additional debranding features.

## Table of Contents

1. [Change Brand Name from "Saytu" to Another Name](#change-brand-name)
2. [Add Custom Logo](#add-custom-logo)
3. [Add "My Account" Menu Item](#add-my-account-menu-item)
4. [Customize Login Page](#customize-login-page)
5. [Debrand Database Manager (Advanced)](#debrand-database-manager)
6. [Add Custom Favicon](#add-custom-favicon)
7. [Customize Error Messages](#customize-error-messages)

---

## 1. Change Brand Name from "Saytu" to Another Name {#change-brand-name}

To change the brand name from "Saytu" to your own brand (e.g., "MyCompany"):

### Step 1: Update XML Templates

**File**: `views/webclient_templates.xml`

Find and replace all occurrences of "Saytu" with your brand name:

```xml
<!-- Change page title -->
<title t-esc="title or 'MyCompany'"/>

<!-- Change login footer -->
<span class="text-muted">Powered by MyCompany</span>

<!-- Change brand promotion -->
<span class="badge text-bg-light">MyCompany</span>
```

### Step 2: Update JavaScript Files

**File**: `static/src/webclient/error_dialogs.js`

Replace "Saytu" with your brand name:

```javascript
switch (this.props.type) {
    case "server":
        this.title = _t("MyCompany Server Error");
        break;
    case "script":
        this.title = _t("MyCompany Client Error");
        break;
    case "network":
        this.title = _t("MyCompany Network Error");
        break;
}
```

### Step 3: Update Module Manifest

**File**: `__manifest__.py`

Update the module name and description:

```python
{
    'name': 'MyCompany Debranding',
    'summary': 'Remove Odoo branding and replace with MyCompany branding',
    'website': 'https://www.mycompany.com',
    # ... rest of manifest
}
```

### Step 4: Restart and Update

```bash
# Restart Odoo server
sudo systemctl restart odoo

# Update the module
# Go to Apps → Saytu Debranding → Upgrade
```

---

## 2. Add Custom Logo {#add-custom-logo}

### Step 1: Prepare Your Logo

1. Create a logo image (PNG or SVG recommended)
2. Recommended sizes:
   - Main logo: 200x60px
   - Small logo: 62x20px
   - Favicon: 32x32px

### Step 2: Add Logo to Module

Place your logo in the module:

```
custom/addons/saytu_debranding/static/src/img/
├── logo.png          # Main logo
├── logo_small.png    # Small logo for brand promotion
└── favicon.ico       # Favicon
```

### Step 3: Update Templates

**File**: `views/webclient_templates.xml`

Add logo replacement:

```xml
<!-- Replace brand promotion logo -->
<template id="saytu_brand_promotion_message" inherit_id="web.brand_promotion_message">
    <xpath expr="//t[@t-set='odoo_logo']" position="replace">
        <t t-set="saytu_logo">
            <img src="/saytu_debranding/static/src/img/logo_small.png" 
                 alt="MyCompany" 
                 style="height: 1em; vertical-align: baseline;"/>
        </t>
    </xpath>
    <!-- ... rest of template -->
</template>

<!-- Replace login page logo -->
<template id="saytu_login_logo" inherit_id="web.login_layout">
    <xpath expr="//img[@alt='Logo']" position="attributes">
        <attribute name="src">/saytu_debranding/static/src/img/logo.png</attribute>
        <attribute name="alt">MyCompany</attribute>
    </xpath>
</template>
```

---

## 3. Add "My Account" Menu Item {#add-my-account-menu-item}

To add a custom "My Account" menu item (e.g., "Mon compte Saytu"):

**File**: `static/src/webclient/user_menu_items.js`

Uncomment and customize the code at the bottom:

```javascript
/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { browser } from "@web/core/browser/browser";

const userMenuRegistry = registry.category("user_menuitems");

// Remove the "My Odoo.com Account" menu item
if (userMenuRegistry.contains("account")) {
    userMenuRegistry.remove("account");
}

// Add custom "My Saytu Account" menu item
function saytAccountItem(env) {
    return {
        type: "item",
        id: "saytu_account",
        description: _t("Mon compte Saytu"),  // Change this text
        callback: () => {
            // Change this URL to your account page
            browser.open("https://www.saytu.com/account", "_blank");
        },
        sequence: 60,
    };
}

userMenuRegistry.add("saytu_account", saytAccountItem);
```

**For French translation**:

The text "Mon compte Saytu" will automatically be translatable. To add translations:

1. Generate PO files: `python3 odoo-bin -d your_db -u saytu_debranding --i18n-export=saytu_fr.po --language=fr_FR`
2. Edit the PO file to add translations
3. Import: `python3 odoo-bin -d your_db --i18n-import=saytu_fr.po --language=fr_FR`

---

## 4. Customize Login Page {#customize-login-page}

### Add Custom Styling

**File**: `static/src/scss/debranding.scss`

```scss
// Custom login page styling
.oe_login_form {
    // Custom background
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    
    .card {
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        border-radius: 10px;
    }
}

// Custom login button
.oe_login_form .btn-primary {
    background-color: #667eea;
    border-color: #667eea;
    
    &:hover {
        background-color: #5568d3;
        border-color: #5568d3;
    }
}

// Custom logo styling
.oe_login_form img[alt="Saytu"] {
    max-height: 80px;
    margin-bottom: 20px;
}
```

### Add Custom Footer Text

**File**: `views/webclient_templates.xml`

```xml
<template id="saytu_login_footer" inherit_id="web.login_layout">
    <xpath expr="//div[@class='text-center small mt-4 pt-3 border-top']" position="replace">
        <div class="text-center small mt-4 pt-3 border-top">
            <t t-if="not disable_database_manager">
                <a class="border-end pe-2 me-1" href="/web/database/manager">Manage Databases</a>
            </t>
            <span class="text-muted">© 2025 MyCompany. All rights reserved.</span>
        </div>
    </xpath>
</template>
```

---

## 5. Debrand Database Manager (Advanced) {#debrand-database-manager}

The database manager is a static HTML file. Here's how to create a custom controller to serve a debranded version:

### Step 1: Create Custom HTML Template

**File**: `static/src/public/database_manager_custom.qweb.html`

Copy the original file from `addons/web/static/src/public/database_manager.qweb.html` and modify:

```html
<html>
<head>
    <title>Saytu</title>  <!-- Changed from "Odoo" -->
    <!-- ... rest of head ... -->
</head>
<body>
    <div class="container">
        <div class="row">
            <div class="col-lg-6 offset-lg-3 o_database_list">
                <!-- Custom logo -->
                <img src="/saytu_debranding/static/src/img/logo.png" class="img-fluid d-block mx-auto"/>
                
                <!-- Changed warning text -->
                <div class="alert alert-warning">
                    Warning, your database manager is not protected.<br/>
                    Please <a href="#" data-bs-toggle="modal" data-bs-target=".o_database_master">set a master password</a> to secure it.
                </div>
                
                <!-- Remove privacy policy link -->
                <!-- <small class="text-muted">...</small> -->
                
                <!-- ... rest of template ... -->
            </div>
        </div>
    </div>
</body>
</html>
```

### Step 2: Create Custom Controller

**File**: `models/ir_http.py`

```python
# -*- coding: utf-8 -*-

from odoo import models
from odoo.http import request, route, Controller
import os

class DatabaseManagerController(Controller):
    
    @route('/web/database/manager', type='http', auth="none")
    def database_manager(self, **kwargs):
        """Serve custom database manager page"""
        # Get the custom template path
        module_path = os.path.dirname(os.path.dirname(__file__))
        template_path = os.path.join(
            module_path, 
            'static/src/public/database_manager_custom.qweb.html'
        )
        
        # Read and return the custom template
        with open(template_path, 'r') as f:
            return f.read()
```

### Step 3: Update __init__.py

**File**: `models/__init__.py`

```python
# -*- coding: utf-8 -*-

from . import ir_http
```

### Step 4: Update __manifest__.py

Add the controller to the manifest:

```python
{
    # ... other settings ...
    'data': [
        'views/webclient_templates.xml',
        'views/database_manager_templates.xml',
    ],
    # ... rest of manifest ...
}
```

---

## 6. Add Custom Favicon {#add-custom-favicon}

### Step 1: Create Favicon

Create a favicon.ico file (32x32px or 16x16px)

### Step 2: Add to Module

Place it in: `static/src/img/favicon.ico`

### Step 3: Update Template

**File**: `views/webclient_templates.xml`

```xml
<template id="saytu_favicon" inherit_id="web.layout">
    <xpath expr="//link[@rel='shortcut icon']" position="attributes">
        <attribute name="href">/saytu_debranding/static/src/img/favicon.ico</attribute>
    </xpath>
</template>
```

---

## 7. Customize Error Messages {#customize-error-messages}

### Make Error Messages More Generic

**File**: `static/src/webclient/error_dialogs.js`

```javascript
patch(ErrorDialog.prototype, {
    inferTitle() {
        super.inferTitle(...arguments);
        
        if (!this.props.type) {
            return;
        }
        
        // Use generic error titles without brand name
        switch (this.props.type) {
            case "server":
                this.title = _t("Server Error");  // No brand name
                break;
            case "script":
                this.title = _t("Client Error");  // No brand name
                break;
            case "network":
                this.title = _t("Network Error");  // No brand name
                break;
        }
    },
});
```

### Add Custom Error Styling

**File**: `static/src/scss/debranding.scss`

```scss
// Custom error dialog styling
.modal-dialog .o_error_dialog {
    .modal-header {
        background-color: #dc3545;
        color: white;
        
        .modal-title {
            font-weight: 600;
        }
    }
    
    .modal-body {
        padding: 20px;
        
        .o_error_detail {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 0.875rem;
        }
    }
}
```

---

## Testing Your Changes

After making any customizations:

1. **Restart Odoo**:
   ```bash
   sudo systemctl restart odoo
   ```

2. **Update the module**:
   - Go to Apps → Saytu Debranding → Upgrade

3. **Clear browser cache**:
   - Press `Ctrl+Shift+Delete`
   - Select "Cached images and files"
   - Click "Clear data"

4. **Hard refresh**:
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

5. **Test all pages**:
   - Login page
   - Main dashboard
   - User menu
   - Error dialogs (trigger an error to test)
   - Database manager (if customized)

---

## Troubleshooting

### Changes Not Appearing

1. Check browser console for JavaScript errors (F12)
2. Check Odoo logs for Python errors
3. Verify files are in correct locations
4. Clear browser cache completely
5. Restart Odoo server

### JavaScript Not Loading

1. Check `__manifest__.py` assets section
2. Verify file paths are correct
3. Check browser Network tab (F12) to see if files are loaded
4. Look for 404 errors

### Templates Not Updating

1. Verify XML syntax is correct
2. Check Odoo logs for XML parsing errors
3. Update the module (don't just restart)
4. Check XPath expressions are correct

---

## Best Practices

1. **Always test in development first**
2. **Keep backups** of your customizations
3. **Document your changes** in comments
4. **Use version control** (git) for your custom module
5. **Test after Odoo updates** to ensure compatibility

---

## Advanced: Creating a Configurable Brand Name

To make the brand name configurable through Odoo settings:

### Step 1: Add System Parameter

Go to Settings → Technical → Parameters → System Parameters

Add a new parameter:
- Key: `saytu_debranding.brand_name`
- Value: `MyCompany`

### Step 2: Use in Templates

**File**: `views/webclient_templates.xml`

```xml
<template id="saytu_layout" inherit_id="web.layout">
    <xpath expr="//title" position="replace">
        <title t-esc="title or request.env['ir.config_parameter'].sudo().get_param('saytu_debranding.brand_name', 'Saytu')"/>
    </xpath>
</template>
```

### Step 3: Use in JavaScript

**File**: `static/src/webclient/error_dialogs.js`

```javascript
import { rpc } from "@web/core/network/rpc";

patch(ErrorDialog.prototype, {
    async inferTitle() {
        super.inferTitle(...arguments);
        
        // Get brand name from system parameter
        const brandName = await rpc("/web/dataset/call_kw", {
            model: "ir.config_parameter",
            method: "get_param",
            args: ["saytu_debranding.brand_name", "Saytu"],
            kwargs: {},
        });
        
        if (this.props.type) {
            switch (this.props.type) {
                case "server":
                    this.title = `${brandName} Server Error`;
                    break;
                // ... etc
            }
        }
    },
});
```

---

**Last Updated**: 2025-11-11  
**Module Version**: 19.0.1.0.0

