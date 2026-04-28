'use client'

import type { Dispatch, SetStateAction } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export interface ListingFormState {
  name: string
  location: string
  structure: string
  documentSet: number
  supply: string
  price: string
}

export function ListingWizardModal({
  isOpen,
  listingStep,
  listingForm,
  setListingStep,
  setListingForm,
  resetListing,
}: {
  isOpen: boolean
  listingStep: number
  listingForm: ListingFormState
  setListingStep: Dispatch<SetStateAction<number>>
  setListingForm: Dispatch<SetStateAction<ListingFormState>>
  resetListing: () => void
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            className="w-full max-w-3xl rounded-2xl p-5 sm:p-6"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-visible)' }}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-body uppercase tracking-[0.3em]" style={{ color: 'var(--text-ghost)' }}>
                  Step {listingStep} of 5
                </p>
                <h2 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
                  List New Property
                </h2>
              </div>
              <button
                onClick={resetListing}
                className="text-xl"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Close listing modal"
              >
                ×
              </button>
            </div>

            <div className="mb-6 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: listingStep >= step ? '100%' : '0%', background: 'var(--gold-primary)' }} />
                </div>
              ))}
            </div>

            {listingStep === 1 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                    Property Name
                  </label>
                  <input
                    value={listingForm.name}
                    onChange={(event) => setListingForm((current) => ({ ...current, name: event.target.value }))}
                    className="terminal-input w-full rounded-xl px-4 py-3 text-sm font-body"
                    placeholder="Pearl Residences Phase II"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                    Location
                  </label>
                  <input
                    value={listingForm.location}
                    onChange={(event) => setListingForm((current) => ({ ...current, location: event.target.value }))}
                    className="terminal-input w-full rounded-xl px-4 py-3 text-sm font-body"
                    placeholder="Dubai, UAE"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                    Legal Structure
                  </label>
                  <select
                    value={listingForm.structure}
                    onChange={(event) => setListingForm((current) => ({ ...current, structure: event.target.value }))}
                    className="terminal-input w-full rounded-xl px-4 py-3 text-sm font-body"
                  >
                    <option style={{ background: '#13131f' }}>SPV</option>
                    <option style={{ background: '#13131f' }}>REIT feeder</option>
                    <option style={{ background: '#13131f' }}>Trust wrapper</option>
                  </select>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="mb-2 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                    Preview
                  </p>
                  <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                    {listingForm.name || 'Unnamed property'}
                  </p>
                  <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                    {listingForm.location || 'Location pending'}
                  </p>
                </div>
              </div>
            )}

            {listingStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  Upload legal docs, valuation packs, and rent agreements to IPFS.
                </p>
                {[
                  'SPV incorporation docs',
                  'Property valuation report',
                  'Tenancy or income agreement',
                ].map((item) => (
                  <div key={item} className="flex items-center justify-between gap-4 rounded-xl p-4" style={{ border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.015)' }}>
                    <div>
                      <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                        {item}
                      </p>
                      <p className="mt-1 text-xs font-body" style={{ color: 'var(--text-ghost)' }}>
                        Ready for IPFS pinning
                      </p>
                    </div>
                    <button className="rounded-full px-3 py-2 text-[10px] font-body uppercase tracking-widest" style={{ border: '1px solid var(--border-visible)', color: 'var(--text-secondary)' }}>
                      Upload
                    </button>
                  </div>
                ))}
              </div>
            )}

            {listingStep === 3 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                    Token Supply
                  </label>
                  <input
                    value={listingForm.supply}
                    onChange={(event) => setListingForm((current) => ({ ...current, supply: event.target.value }))}
                    className="terminal-input w-full rounded-xl px-4 py-3 text-sm font-data"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                    Price Per Token
                  </label>
                  <input
                    value={listingForm.price}
                    onChange={(event) => setListingForm((current) => ({ ...current, price: event.target.value }))}
                    className="terminal-input w-full rounded-xl px-4 py-3 text-sm font-data"
                  />
                </div>
                <div className="rounded-xl p-4 md:col-span-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="mb-2 text-[10px] font-body uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                    Issuance Preview
                  </p>
                  <p className="font-data text-2xl" style={{ color: 'var(--gold-primary)' }}>
                    ${((Number(listingForm.supply) || 0) * (Number(listingForm.price) || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {listingStep === 4 && (
              <div className="space-y-3">
                {[
                  ['Property', listingForm.name || 'Pearl Residences Phase II'],
                  ['Location', listingForm.location || 'Dubai, UAE'],
                  ['Legal Structure', listingForm.structure],
                  ['Documents', `${listingForm.documentSet} uploaded`],
                  ['Token Supply', `${Number(listingForm.supply || 0).toLocaleString()} units`],
                  ['Price', `$${listingForm.price} / token`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <span className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                      {label}
                    </span>
                    <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {listingStep === 5 && (
              <div className="py-8 text-center">
                <div className="mb-4 text-5xl">✓</div>
                <h3 className="mb-3 font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
                  Property live on Arbitrum Sepolia
                </h3>
                <p className="mx-auto max-w-lg text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  Listing metadata is pinned, confidential token parameters are set, and the offering is ready for investor discovery.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => setListingStep((current) => Math.max(1, current - 1))}
                disabled={listingStep === 1 || listingStep === 5}
                className="rounded px-4 py-3 text-sm btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>

              {listingStep < 4 && (
                <button onClick={() => setListingStep((current) => current + 1)} className="rounded px-4 py-3 text-sm btn-gold">
                  Continue
                </button>
              )}

              {listingStep === 4 && (
                <button onClick={() => setListingStep(5)} className="rounded px-4 py-3 text-sm btn-gold">
                  Confirm & Deploy
                </button>
              )}

              {listingStep === 5 && (
                <button onClick={resetListing} className="rounded px-4 py-3 text-sm btn-gold">
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
