# Installation Guide - Saytu Debranding Module

This guide provides step-by-step instructions for installing the Saytu Debranding module in Odoo 19 Community Edition.

## Prerequisites

Before installing the module, ensure you have:

- ✅ Odoo 19 Community Edition installed and running
- ✅ Access to the Odoo installation directory
- ✅ Admin/superuser access to the Odoo database
- ✅ The module files in `custom/addons/saytu_debranding/`

## Installation Methods

### Method 1: Via Odoo Web Interface (Recommended)

This is the easiest and safest method.

#### Step 1: Verify Module Location

Ensure the module is in the correct location:

```bash
ls -la custom/addons/saytu_debranding/
```

You should see:
```
__init__.py
__manifest__.py
models/
views/
static/
README.md
BRANDING_POINTS.md
CUSTOMIZATION_GUIDE.md
INSTALLATION.md
```

#### Step 2: Verify Addons Path

Check that `custom/addons` is in your Odoo configuration:

```bash
grep "addons_path" odoo.conf
```

You should see something like:
```
addons_path = /path/to/odoo/addons,/path/to/odoo/custom/addons
```

If `custom/addons` is not in the path, add it:

```bash
# Edit odoo.conf
nano odoo.conf

# Add custom/addons to addons_path
addons_path = /path/to/odoo/addons,/path/to/odoo/custom/addons
```

#### Step 3: Restart Odoo Server

```bash
# If using systemd
sudo systemctl restart odoo

# Or if running manually
# Stop the server (Ctrl+C) and restart it
./odoo-bin -c odoo.conf
```

#### Step 4: Update Apps List

1. Log in to Odoo as an administrator
2. Go to **Apps** menu (top navigation)
3. Click the **⋮** (three dots) menu in the top-right
4. Click **"Update Apps List"**
5. In the confirmation dialog, click **"Update"**
6. Wait for the update to complete

#### Step 5: Remove "Apps" Filter

1. In the Apps page, you'll see a search bar
2. There's a filter chip that says **"Apps"**
3. Click the **X** on that chip to remove it
4. This will show all modules, not just applications

#### Step 6: Search for the Module

1. In the search bar, type: **saytu_debranding** or **Saytu Debranding**
2. You should see the "Saytu Debranding" module appear

If you don't see it:
- Check that you removed the "Apps" filter
- Verify the module is in the correct directory
- Check Odoo logs for errors: `tail -f /var/log/odoo/odoo.log`

#### Step 7: Install the Module

1. Click the **"Install"** button on the Saytu Debranding module
2. Wait for installation to complete (should take a few seconds)
3. You'll see a confirmation message when done

#### Step 8: Clear Browser Cache and Refresh

This is **critical** for the changes to take effect:

1. **Clear browser cache**:
   - Press `Ctrl+Shift+Delete` (Windows/Linux)
   - Press `Cmd+Shift+Delete` (Mac)
   - Select "Cached images and files"
   - Click "Clear data"

2. **Hard refresh the page**:
   - Press `Ctrl+Shift+R` (Windows/Linux)
   - Press `Cmd+Shift+R` (Mac)

3. **Alternatively**, close all browser tabs and reopen Odoo

#### Step 9: Verify Installation

Check that the debranding is working:

1. **Page Title**: Browser tab should say "Saytu" instead of "Odoo"
2. **User Menu**: "My Odoo.com Account" should be gone
3. **Login Page**: Footer should say "Powered by Saytu" instead of linking to odoo.com
4. **Error Dialogs**: Trigger an error (e.g., try to delete a required record) and check the title says "Saytu" instead of "Odoo"

---

### Method 2: Via Command Line

This method is faster but requires command-line access.

#### Step 1: Install via odoo-bin

```bash
# Navigate to Odoo directory
cd /path/to/odoo

# Install the module
./odoo-bin -c odoo.conf -d your_database_name -i saytu_debranding --stop-after-init

# Replace 'your_database_name' with your actual database name
```

#### Step 2: Restart Odoo

```bash
sudo systemctl restart odoo
```

#### Step 3: Clear Browser Cache

Follow Step 8 from Method 1 above.

---

### Method 3: Via Odoo Shell (Advanced)

For advanced users who want to install via Python shell:

```bash
# Open Odoo shell
./odoo-bin shell -c odoo.conf -d your_database_name --no-http

# In the shell, run:
env['ir.module.module'].search([('name', '=', 'saytu_debranding')]).button_immediate_install()
env.cr.commit()
exit()
```

Then restart Odoo and clear browser cache.

---

## Post-Installation

### Verify Installation Status

1. Go to **Apps** → **Installed**
2. Search for "Saytu Debranding"
3. You should see it with a green "Installed" badge

### Check Logs for Errors

```bash
# View recent logs
tail -n 100 /var/log/odoo/odoo.log

# Or if running manually
# Check the terminal output for errors
```

### Test All Features

1. **Login Page**:
   - Log out and check the login page
   - Footer should say "Powered by Saytu"

2. **User Menu**:
   - Click your user icon in top-right
   - "My Odoo.com Account" should be gone

3. **Page Title**:
   - Check browser tab title
   - Should say "Saytu" or your page name

4. **Error Dialogs**:
   - Trigger an error (e.g., validation error)
   - Title should say "Saytu Server Error"

5. **Brand Promotion**:
   - Check any pages with "Powered by" text
   - Should say "Powered by Saytu"

---

## Troubleshooting

### Module Not Appearing in Apps List

**Problem**: Can't find the module after updating apps list.

**Solutions**:
1. Check module is in correct directory:
   ```bash
   ls -la custom/addons/saytu_debranding/
   ```

2. Check `addons_path` in `odoo.conf`:
   ```bash
   grep "addons_path" odoo.conf
   ```

3. Check Odoo logs for errors:
   ```bash
   tail -f /var/log/odoo/odoo.log
   ```

4. Verify Python syntax:
   ```bash
   python3 -m py_compile custom/addons/saytu_debranding/__manifest__.py
   ```

5. Verify XML syntax:
   ```bash
   python3 -c "import xml.etree.ElementTree as ET; ET.parse('custom/addons/saytu_debranding/views/webclient_templates.xml')"
   ```

### Installation Fails

**Problem**: Module installation fails with an error.

**Solutions**:
1. Check Odoo logs for the specific error
2. Verify all dependencies are installed (base, web)
3. Check file permissions:
   ```bash
   chmod -R 755 custom/addons/saytu_debranding/
   ```

### Branding Still Appears

**Problem**: After installation, Odoo branding still appears.

**Solutions**:
1. **Clear browser cache completely**:
   - `Ctrl+Shift+Delete` → Clear all cached data
   
2. **Hard refresh**:
   - `Ctrl+Shift+R` multiple times
   
3. **Try a different browser** or **incognito mode**

4. **Check JavaScript console** for errors:
   - Press F12 → Console tab
   - Look for red errors

5. **Verify assets are loaded**:
   - Press F12 → Network tab
   - Refresh page
   - Search for "user_menu_items.js" and "error_dialogs.js"
   - They should load with status 200

6. **Regenerate assets**:
   ```bash
   ./odoo-bin -c odoo.conf -d your_database_name -u saytu_debranding --stop-after-init
   ```

### JavaScript Not Loading

**Problem**: JavaScript files not loading or not working.

**Solutions**:
1. Check browser console (F12) for errors
2. Check Network tab (F12) for 404 errors
3. Verify file paths in `__manifest__.py`
4. Clear browser cache completely
5. Restart Odoo server

---

## Uninstallation

If you need to uninstall the module:

### Via Web Interface

1. Go to **Apps** → **Installed**
2. Search for "Saytu Debranding"
3. Click **"Uninstall"**
4. Confirm the uninstallation
5. Clear browser cache and refresh

### Via Command Line

```bash
./odoo-bin -c odoo.conf -d your_database_name -u saytu_debranding --stop-after-init
```

**Note**: After uninstallation, all Odoo branding will return.

---

## Upgrading the Module

If you make changes to the module files:

### Via Web Interface

1. Go to **Apps** → **Installed**
2. Search for "Saytu Debranding"
3. Click **"Upgrade"**
4. Clear browser cache and refresh

### Via Command Line

```bash
./odoo-bin -c odoo.conf -d your_database_name -u saytu_debranding --stop-after-init
sudo systemctl restart odoo
```

---

## Multi-Database Installation

If you have multiple databases:

### Install on All Databases

```bash
# List all databases
./odoo-bin -c odoo.conf --list-databases

# Install on each database
./odoo-bin -c odoo.conf -d database1 -i saytu_debranding --stop-after-init
./odoo-bin -c odoo.conf -d database2 -i saytu_debranding --stop-after-init
```

### Install on Specific Database Only

The module is installed per-database, so you can choose which databases get the debranding.

---

## Production Deployment

For production environments:

1. **Test in staging first**
2. **Backup your database** before installation
3. **Schedule maintenance window** for installation
4. **Notify users** about the branding change
5. **Monitor logs** after installation
6. **Test all critical workflows** after installation

---

## Support

If you encounter issues:

1. Check this installation guide thoroughly
2. Check `README.md` for general information
3. Check `BRANDING_POINTS.md` for what's changed
4. Check `CUSTOMIZATION_GUIDE.md` for customization help
5. Check browser console (F12) for JavaScript errors
6. Check Odoo logs for backend errors
7. Try in incognito mode to rule out browser cache issues

---

**Last Updated**: 2025-11-11  
**Module Version**: 19.0.1.0.0  
**Status**: ✅ Production Ready

