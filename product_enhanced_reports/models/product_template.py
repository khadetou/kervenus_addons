# Part of Odoo. See LICENSE file for full copyright and licensing details.

import re
from markupsafe import Markup
from odoo import fields, models
from odoo.tools import is_html_empty
from odoo.tools.mail import html2plaintext


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # Override description_sale to use Html field instead of Text
    # This enables the HTML editor widget for rich text formatting
    description_sale = fields.Html(
        string='Sales Description',
        translate=True,
        help="A description of the Product that you want to communicate to your customers. "
             "This description will be copied to every Sales Order, Delivery Order and Customer Invoice/Credit Note. "
             "You can use HTML formatting like bullet points, bold, italics, etc. "
             "Note: Block elements (like paragraphs) will be converted for PDF compatibility."
    )


class ProductProduct(models.Model):
    _inherit = 'product.product'

    def get_product_multiline_description_sale(self):
        """Compute a multiline description of this product, in the context of sales.

        Overridden to handle HTML content in description_sale field.
        For backend views (sale order lines), HTML is converted to plain text for proper display.
        For PDF reports, the HTML description is accessed directly from the product to preserve formatting.
        """
        name = self.display_name
        if self.description_sale and not is_html_empty(self.description_sale):
            # Convert HTML to plain text for the sale order line name field
            # This ensures proper display in backend views without raw HTML tags
            # PDF reports access product.description_sale directly to render HTML formatting
            plain_description = html2plaintext(self.description_sale, include_references=False)
            if plain_description:
                name += '\n' + plain_description
        return name

    def get_description_sale_for_pdf(self):
        """Get the sales description formatted for PDF reports.

        This method sanitizes HTML content to ensure proper rendering in PDFs:
        - Converts block-level elements to inline with proper spacing
        - Removes scripts and unsafe tags
        - Ensures the content fits well in table cells

        Returns:
            Markup | bool: Sanitized HTML safe for PDF rendering, or False if empty
        """
        self.ensure_one()
        if not self.description_sale or is_html_empty(self.description_sale):
            return False

        # Get the HTML content
        html_content = self.description_sale

        # Sanitize for PDF table cell rendering
        # Replace block elements with inline equivalents to prevent layout issues
        html_content = self._sanitize_html_for_pdf(html_content)

        return Markup(html_content)

    def _sanitize_html_for_pdf(self, html_content):
        """Sanitize HTML content for safe PDF rendering in table cells.

        PDF rendering engines (wkhtmltopdf) can have issues with block-level
        elements inside table cells. This method converts common block elements
        to inline-friendly equivalents.

        Args:
            html_content (str): Raw HTML content

        Returns:
            str: Sanitized HTML suitable for PDF table cells
        """
        if not html_content:
            return html_content

        # Replace <p> tags with <span> + <br/> for inline display
        html_content = re.sub(r'<p[^>]*>', '<span style="display: inline;">', html_content, flags=re.IGNORECASE)
        html_content = re.sub(r'</p>', '</span><br/>', html_content, flags=re.IGNORECASE)

        # Convert <div> to <span> (but preserve styling)
        html_content = re.sub(r'<div[^>]*>', '<span style="display: inline;">', html_content, flags=re.IGNORECASE)
        html_content = re.sub(r'</div>', '</span>', html_content, flags=re.IGNORECASE)

        # Ensure <ul>/<ol> have proper styling but keep them as lists
        # Add inline-block to prevent table layout breaks
        html_content = re.sub(
            r'<ul[^>]*>',
            '<ul style="margin: 0; padding-left: 15px; display: inline-block; vertical-align: top;">',
            html_content,
            flags=re.IGNORECASE
        )
        html_content = re.sub(
            r'<ol[^>]*>',
            '<ol style="margin: 0; padding-left: 15px; display: inline-block; vertical-align: top;">',
            html_content,
            flags=re.IGNORECASE
        )

        # Remove any scripts or event handlers for security
        html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
        html_content = re.sub(r'\son\w+="[^"]*"', '', html_content, flags=re.IGNORECASE)
        html_content = re.sub(r"\son\w+='[^']*'", '', html_content, flags=re.IGNORECASE)

        # Clean up multiple consecutive <br/> tags
        html_content = re.sub(r'(<br\s*/?>\s*){3,}', '<br/><br/>', html_content, flags=re.IGNORECASE)

        return html_content
