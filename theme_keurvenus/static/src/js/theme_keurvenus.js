/** @odoo-module **/

import { rpc } from "@web/core/network/rpc";
import { patch } from "@web/core/utils/patch";
import wSaleUtils from "@website_sale/js/website_sale_utils";
import wishlistUtils from "@website_sale_wishlist/js/website_sale_wishlist_utils";
import { AddProductToWishlistButton } from "@website_sale_wishlist/interactions/add_product_to_wishlist_button";

const KV_WISHLIST_CARD_SELECTOR = [
    ".kv-product-card",
    ".kv-small-card",
    ".kv-shop-product-card",
    ".kv-related-card",
    ".kv-suggest-card",
    ".kv-wish-card",
].join(", ");

const KV_WISHLIST_VISUAL_SELECTOR = [
    ".kv-product-card__visual",
    ".kv-small-card__visual",
    ".kv-shop-product-card__visual",
    ".kv-related-card__visual",
    ".kv-suggest-card__visual",
    ".kv-wish-card__visual",
].join(", ");

function updateWishlistButtonAppearance(button, isActive) {
    if (!button) {
        return;
    }
    wishlistUtils.updateDisabled(button, isActive);
    button.classList.toggle("is-active", isActive);

    const iconifyIcon = button.querySelector("iconify-icon");
    if (iconifyIcon) {
        iconifyIcon.setAttribute("icon", isActive ? "solar:heart-bold" : "solar:heart-linear");
    }

    const faIcon = button.querySelector(".fa");
    if (faIcon) {
        faIcon.classList.toggle("fa-heart", isActive);
        faIcon.classList.toggle("fa-heart-o", !isActive);
    }
}

function animateWishlistTarget(target) {
    if (!target) {
        return;
    }
    target.classList.remove("d-none");
    target.querySelectorAll(".o_animate_blink").forEach((badge) => {
        badge.classList.add("o_red_highlight", "o_shadow_animation");
        window.setTimeout(() => badge.classList.remove("o_shadow_animation"), 500);
        window.setTimeout(() => badge.classList.remove("o_red_highlight"), 2500);
    });
}

async function animateWishlistClone(button, sourceElement) {
    const wishlistTarget = document.querySelector(".o_wsale_my_wish");
    if (!wishlistTarget || !sourceElement) {
        return;
    }

    const visual = sourceElement.matches(KV_WISHLIST_VISUAL_SELECTOR)
        ? sourceElement
        : sourceElement.querySelector(KV_WISHLIST_VISUAL_SELECTOR) || sourceElement;
    const image = visual?.querySelector("img");
    const sourceRect = (image || visual)?.getBoundingClientRect?.();
    if (!sourceRect || !sourceRect.width || !sourceRect.height) {
        animateWishlistTarget(wishlistTarget);
        return;
    }

    const clone = image ? image.cloneNode(true) : document.createElement("div");
    if (!image) {
        const backgroundImage = window.getComputedStyle(visual).backgroundImage;
        if (!backgroundImage || backgroundImage === "none") {
            animateWishlistTarget(wishlistTarget);
            return;
        }
        clone.style.backgroundImage = backgroundImage;
        clone.style.backgroundPosition = window.getComputedStyle(visual).backgroundPosition;
        clone.style.backgroundSize = window.getComputedStyle(visual).backgroundSize;
        clone.style.backgroundRepeat = "no-repeat";
        clone.style.borderRadius = window.getComputedStyle(visual).borderRadius;
    }

    Object.assign(clone.style, {
        position: "fixed",
        top: `${sourceRect.top}px`,
        left: `${sourceRect.left}px`,
        width: `${sourceRect.width}px`,
        height: `${sourceRect.height}px`,
        objectFit: "cover",
        zIndex: "1200",
        pointerEvents: "none",
        transition: "top 500ms ease, left 500ms ease, width 500ms ease, height 500ms ease, opacity 500ms ease",
    });

    document.body.appendChild(clone);
    animateWishlistTarget(wishlistTarget);

    const targetRect = wishlistTarget.getBoundingClientRect();
    await new Promise((resolve) => {
        requestAnimationFrame(() => {
            clone.style.top = `${targetRect.top + 25}px`;
            clone.style.left = `${targetRect.left + 40}px`;
            clone.style.width = "75px";
            clone.style.height = "75px";
            clone.style.opacity = "0.78";
        });
        window.setTimeout(() => {
            clone.style.width = "0px";
            clone.style.height = "0px";
            clone.style.opacity = "0";
        }, 520);
        window.setTimeout(() => {
            clone.remove();
            resolve();
        }, 900);
    });
}

function syncWishlistButtons() {
    const wishlistProductIds = new Set(wishlistUtils.getWishlistProductIds());
    document.querySelectorAll(".kv-wish-btn.o_add_wishlist, .kv-wish-btn.o_add_wishlist_dyn").forEach((button) => {
        const productId = Number(button.dataset.productProductId || 0);
        updateWishlistButtonAppearance(button, Boolean(productId && wishlistProductIds.has(productId)));
    });
}

patch(AddProductToWishlistButton.prototype, {
    async addProduct(ev) {
        const el = ev.currentTarget;
        let productId = parseInt(el.dataset.productProductId);
        const form = wSaleUtils.getClosestProductForm(el);
        if (!productId) {
            productId = await this.waitFor(rpc("/sale/create_product_variant", {
                product_template_id: parseInt(el.dataset.productTemplateId),
                product_template_attribute_value_ids: wSaleUtils.getSelectedAttributeValues(form),
            }));
        }
        if (!productId || wishlistUtils.getWishlistProductIds().includes(productId)) {
            updateWishlistButtonAppearance(el, true);
            return;
        }

        await this.waitFor(rpc("/shop/wishlist/add", { product_id: productId }));
        wishlistUtils.addWishlistProduct(productId);
        wishlistUtils.updateWishlistNavBar();
        updateWishlistButtonAppearance(el, true);

        const animationSource = el.closest(KV_WISHLIST_CARD_SELECTOR)
            || document.querySelector("#product_detail_main")
            || el.closest(".o_cart_product")
            || form;
        await animateWishlistClone(el, animationSource);

        const saveForLaterButton = document.querySelector("#wsale_save_for_later_button");
        const addedToWishListAlert = document.querySelector("#wsale_added_to_your_wishlist_alert");
        if (saveForLaterButton && addedToWishListAlert) {
            saveForLaterButton.classList.add("d-none");
            addedToWishListAlert.classList.remove("d-none");
        }
    },
});

function initDrawer() {
    const drawer = document.getElementById("kv_mobile_drawer");
    if (!drawer) {
        return;
    }

    const openers = document.querySelectorAll("[data-kv-drawer-open]");
    const closers = document.querySelectorAll("[data-kv-drawer-close]");

    const open = () => {
        drawer.classList.add("is-open");
        drawer.setAttribute("aria-hidden", "false");
    };

    const close = () => {
        drawer.classList.remove("is-open");
        drawer.setAttribute("aria-hidden", "true");
    };

    openers.forEach((button) => button.addEventListener("click", open));
    closers.forEach((button) => button.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            close();
        }
    });
}

function initHorizontalScrollButtons() {
    document.querySelectorAll("[data-kv-scroll-target]").forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-kv-scroll-target");
            const direction = Number(button.getAttribute("data-kv-scroll-direction") || 1);
            const target = document.getElementById(targetId);
            if (!target) {
                return;
            }
            target.scrollBy({
                left: direction * Math.max(target.clientWidth * 0.65, 260),
                behavior: "smooth",
            });
        });
    });
}

function initDecorativeChips() {
    document.querySelectorAll(".kv-chip-row").forEach((group) => {
        const chips = group.querySelectorAll(".kv-chip");
        chips.forEach((chip) => {
            chip.addEventListener("click", () => {
                chips.forEach((item) => item.classList.remove("active"));
                chip.classList.add("active");
            });
        });
    });
}

function updateCartBadge(cartQuantity) {
    window.sessionStorage?.setItem("website_sale_cart_quantity", String(cartQuantity));
    const cartIconElement = document.querySelector("li.o_wsale_my_cart");
    if (cartIconElement) {
        cartIconElement.classList.toggle("d-none", !cartQuantity);
    }
    document.querySelectorAll(".my_cart_quantity").forEach((badge) => {
        if (!cartQuantity) {
            badge.classList.add("d-none");
            badge.textContent = "0";
            return;
        }
        badge.classList.remove("d-none");
        badge.classList.add("o_mycart_zoom_animation");
        badge.textContent = String(cartQuantity);
        window.setTimeout(() => badge.classList.remove("o_mycart_zoom_animation"), 300);
    });
}

async function addHomepageProductToCart(form) {
    const productTemplateId = Number(form.querySelector("input[name='product_template_id']")?.value || 0);
    const productId = Number(form.querySelector("input[name='product_id']")?.value || 0);
    const quantity = Number(form.querySelector("input[name='add_qty']")?.value || 1);
    if (!productTemplateId || !productId || !quantity) {
        return;
    }
    const submitButton = form.querySelector(".kv-mini-btn--add");
    submitButton?.setAttribute("disabled", "disabled");
    submitButton?.classList.add("is-loading");
    try {
        const data = await rpc("/shop/cart/add", {
            product_template_id: productTemplateId,
            product_id: productId,
            quantity,
        });
        updateCartBadge(data.cart_quantity || 0);
        if (data.notification_info?.warning) {
            window.alert(data.notification_info.warning);
        }
    } catch (error) {
        console.error("Keur Venus add to cart failed", error);
        window.location.href = "/shop/cart";
    } finally {
        submitButton?.removeAttribute("disabled");
        submitButton?.classList.remove("is-loading");
    }
}

function initHomepageAddToCart() {
    document.querySelectorAll(".kv-mini-cart-form").forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            addHomepageProductToCart(form);
        });
    });
}

function initSearchModal() {
    const modal = document.getElementById("kv_search_modal");
    if (!modal || modal.dataset.kvReady === "1") {
        return;
    }
    modal.dataset.kvReady = "1";

    const form = modal.querySelector(".kv-search-modal-form");
    const syncDropdownLayout = () => {
        const dropdown = modal.querySelector(".kv-search-modal-form .o_dropdown_menu");
        if (!dropdown) {
            return;
        }
        dropdown.style.setProperty("position", "static", "important");
        dropdown.style.setProperty("top", "auto", "important");
        dropdown.style.setProperty("left", "auto", "important");
        dropdown.style.setProperty("right", "auto", "important");
        dropdown.style.setProperty("max-width", "none", "important");
        dropdown.style.setProperty("width", "100%", "important");
        dropdown.style.setProperty("min-width", "0", "important");
        dropdown.style.setProperty("max-height", "min(50vh, 32rem)", "important");
        dropdown.style.setProperty("overflow", "auto", "important");
    };

    modal.addEventListener("shown.bs.modal", () => {
        const input = modal.querySelector(".search-query");
        window.requestAnimationFrame(syncDropdownLayout);
        if (!input) {
            return;
        }
        window.setTimeout(() => {
            input.focus();
            input.select();
        }, 40);
    });

    if (!form) {
        return;
    }

    const queueSyncDropdownLayout = () => {
        window.requestAnimationFrame(syncDropdownLayout);
    };

    form.addEventListener("input", queueSyncDropdownLayout, true);
    form.addEventListener("focusin", queueSyncDropdownLayout, true);

    const resultsObserver = new MutationObserver(queueSyncDropdownLayout);
    resultsObserver.observe(form, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
    });
}

function boot() {
    initDrawer();
    initSearchModal();
    initHorizontalScrollButtons();
    initDecorativeChips();
    initHomepageAddToCart();
    syncWishlistButtons();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}
