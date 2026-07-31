# UI & Sentry - Quick Start Checklist

## 🚀 What to Do Now

### WEEK 1: Setup Error Handling (CRITICAL)

#### Day 1: Sentry Installation
- [ ] Create Sentry account at https://sentry.io/signup/
- [ ] Create New Project (select Next.js)
- [ ] Copy DSN from project settings
- [ ] Run: `npm install @sentry/nextjs @sentry/react @sentry/tracing`
- [ ] Add to `.env.local`: `NEXT_PUBLIC_SENTRY_DSN=<YOUR_DSN>`

#### Day 2: Sentry Configuration  
- [ ] Create `frontend/sentry.config.ts`
- [ ] Update `frontend/next.config.ts` (add Sentry plugin)
- [ ] Create `frontend/src/app/error.tsx`
- [ ] Create `frontend/src/app/global-error.tsx`
- [ ] Create `frontend/src/app/not-found.tsx`

#### Day 3-4: Integration
- [ ] Create `src/hooks/useSentryInit.ts`
- [ ] Update root layout to use Sentry
- [ ] Update API client (`src/lib/api-client.ts`) with error interceptors
- [ ] Create error boundary component

#### Day 5: Testing & Validation
- [ ] Create debug page at `src/app/debug/page.tsx`
- [ ] Test error capturing
- [ ] Test API error handling
- [ ] Verify Sentry dashboard receives events

---

### WEEK 2-3: UI Enhancements (HIGH PRIORITY)

#### Form & Validation Components
- [ ] Create `FormError` component
- [ ] Add validation to all form fields
- [ ] Create `ConfirmDialog` component
- [ ] Add confirmation to delete actions
- [ ] Implement inline validation feedback

#### Loading & Empty States
- [ ] Create `EmptyState` component
- [ ] Create `DataLoader` wrapper component
- [ ] Add loading skeletons to all async components
- [ ] Add empty state UI to all data displays
- [ ] Test loading states visually

#### Table Improvements
- [ ] Add row selection checkboxes
- [ ] Implement bulk action toolbar
- [ ] Add export functionality
- [ ] Add table filtering UI
- [ ] Add sorting indicators

---

### WEEK 4: Performance & Polish (MEDIUM PRIORITY)

#### Dark Mode
- [ ] Verify theme provider works
- [ ] Add dark mode styles to all components
- [ ] Test dark mode toggle
- [ ] Ensure contrast meets WCAG AA

#### Performance Monitoring
- [ ] Enable Sentry performance monitoring
- [ ] Add custom performance metrics
- [ ] Set performance budgets
- [ ] Monitor Core Web Vitals

#### Mobile Optimization
- [ ] Test on mobile devices
- [ ] Fix responsive issues
- [ ] Test touch interactions
- [ ] Optimize for slow networks

---

## 📋 File Changes Summary

### NEW FILES TO CREATE

```
frontend/sentry.config.ts                           (Sentry configuration)
frontend/src/app/error.tsx                          (Error page)
frontend/src/app/global-error.tsx                   (Global error handler)
frontend/src/app/not-found.tsx                      (404 page)
frontend/src/app/debug/page.tsx                     (Debug testing page)
frontend/src/hooks/useSentryInit.ts                 (Sentry initialization)
frontend/src/components/shared/error-boundary.tsx   (Error boundary)
frontend/src/components/ui/form-error.tsx           (Form error display)
frontend/src/components/ui/empty-state.tsx          (Empty state UI)
frontend/src/components/ui/data-loader.tsx          (Loading state wrapper)
frontend/src/components/ui/confirm-dialog.tsx       (Confirmation modal)
```

### FILES TO UPDATE

```
frontend/next.config.ts                             (Add Sentry plugin)
frontend/package.json                               (Add Sentry packages)
frontend/src/app/layout.tsx                         (Add Sentry + error handling)
frontend/src/lib/api-client.ts                      (Add error tracking)
frontend/.env.local                                 (Add SENTRY_DSN)
```

---

## 🔍 Audit Findings Summary

### Current State
- ✅ Good: Radix UI + Shadcn components (23 components)
- ✅ Good: TanStack Query for state management
- ✅ Good: Tailwind CSS for styling
- ❌ Bad: No error handling
- ❌ Bad: No error tracking (Sentry)
- ❌ Bad: No loading states in most components
- ❌ Bad: No empty states
- ❌ Bad: No form validation UI
- ❌ Bad: Dark mode incomplete

### Compliance Score
| Area | Score | Status |
|------|-------|--------|
| UI Components | 90% | ✅ Good |
| Design System | 85% | ✅ Good |
| Error Handling | 0% | 🔴 CRITICAL |
| UX Features | 45% | 🟡 Poor |
| Dark Mode | 30% | 🟡 Poor |
| **OVERALL** | **50%** | 🔴 Needs Work |

---

## 📊 Implementation Timeline

```
WEEK 1  ████████████████████░░░░░░░░░░░░░  CRITICAL PHASE
        ✅ Sentry setup
        ✅ Error handling
        ✅ Error pages

WEEK 2  ░░░░░░░░░░░░░░░░████████████████  HIGH PRIORITY
        ✅ Form validation UI
        ✅ Loading states
        ✅ Empty states

WEEK 3  ░░░░░░░░░░░░░░░░░░░░░░░░░░████  MEDIUM PRIORITY
        ✅ Table features
        ✅ Confirmations
        ✅ Polish

WEEK 4  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  LOW PRIORITY
        ✅ Performance
        ✅ Dark mode
        ✅ Mobile
```

---

## 🎯 Success Criteria

### Week 1 (MUST HAVE)
- [ ] All errors are caught and logged to Sentry
- [ ] Users see error UI (not white screen)
- [ ] API errors are tracked
- [ ] No console errors on startup

### Week 2 (SHOULD HAVE)
- [ ] All forms have validation feedback
- [ ] All data displays have loading state
- [ ] Delete operations require confirmation
- [ ] Empty states are shown when appropriate

### Week 3 (NICE TO HAVE)
- [ ] Tables support bulk operations
- [ ] Dark mode is fully functional
- [ ] Performance metrics are tracked
- [ ] Mobile experience is polished

---

## 📚 Reference Links

- **Sentry Next.js Guide:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **UI Constitution:** `ai/UI.md`
- **Detailed Audit:** `docs/FRONTEND_AUDIT_UI_SENTRY.md`
- **Implementation Guide:** `docs/SENTRY_IMPLEMENTATION_GUIDE.md`

---

## ⚡ Quick Commands

### Install Dependencies
```bash
cd frontend
npm install @sentry/nextjs @sentry/react @sentry/tracing
```

### Start Development
```bash
npm run dev
```

### Test Sentry
```
1. Open http://localhost:3000/debug
2. Click "Capture Exception"
3. Check Sentry dashboard for event
```

### Check Environment
```bash
# Verify DSN is set
echo $NEXT_PUBLIC_SENTRY_DSN

# Should output your DSN (not empty)
```

---

## ❓ FAQ

**Q: Will Sentry affect performance?**  
A: No, events are sent asynchronously. Sample rate controls volume.

**Q: What if DSN is public?**  
A: It's meant to be public. Use rate limiting in Sentry settings.

**Q: Can we test errors locally?**  
A: Yes, use the `/debug` page. Errors are captured in development too.

**Q: How much will Sentry cost?**  
A: Free tier includes 5,000 events/month. Perfect for testing.

**Q: Do we need to update every route?**  
A: No, error.tsx and global-error.tsx handle all routes automatically.

---

## 🚨 Critical Issues to Fix First

1. **No Error Boundary** → Can crash entire app
2. **No Sentry** → Errors invisible in production
3. **No Form Validation UI** → Users confused
4. **No Loading States** → App feels slow
5. **No Empty States** → Unclear what's happening

Start with #1-2, then #3-5.

---

Last Updated: July 31, 2026
