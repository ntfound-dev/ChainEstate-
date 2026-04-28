'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AdminAnalyticsPanel } from '../components/admin/AdminAnalyticsPanel'
import { AdminHeader } from '../components/admin/AdminHeader'
import { AdminPropertiesPanel } from '../components/admin/AdminPropertiesPanel'
import { AdminRegistryPanel } from '../components/admin/AdminRegistryPanel'
import { AdminRentPanel } from '../components/admin/AdminRentPanel'
import { AdminTabs, type AdminTab } from '../components/admin/AdminTabs'
import { ListingWizardModal, type ListingFormState } from '../components/admin/ListingWizardModal'
import type { AdminSummary, RegistryRow } from '../components/admin/types'
import { TransactionModal } from '../components/ui/TransactionModal'
import { useToast } from '../components/ui/Toast'
import { PROPERTIES } from '../lib/propertiesData'

const REGISTRY_ROWS: RegistryRow[] = [
  { wallet: '0x7f3...4a2', role: 'Lead Operator', scope: 'Pearl Residences', status: 'Active' },
  { wallet: '0x91c...b71', role: 'Compliance', scope: 'All SPVs', status: 'Verified' },
  { wallet: '0xa12...ef0', role: 'Treasury', scope: 'Rent Distribution', status: 'Active' },
]

const DEFAULT_FORM: ListingFormState = {
  name: '',
  location: '',
  structure: 'SPV',
  documentSet: 3,
  supply: '500000',
  price: '1.00',
}

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('properties')
  const [selectedPropertyId, setSelectedPropertyId] = useState(PROPERTIES[0].id)
  const [depositAmount, setDepositAmount] = useState('3000')
  const [listingOpen, setListingOpen] = useState(false)
  const [listingStep, setListingStep] = useState(1)
  const [listingForm, setListingForm] = useState(DEFAULT_FORM)
  const [txOpen, setTxOpen] = useState(false)
  const { showToast } = useToast()

  const selectedProperty = PROPERTIES.find((property) => property.id === selectedPropertyId) ?? PROPERTIES[0]
  const depositValue = Number(depositAmount) || 0
  const platformFee = depositValue * 0.05
  const reserve = depositValue * 0.05
  const distributable = depositValue - platformFee - reserve

  const summary = useMemo<AdminSummary>(() => {
    const active = PROPERTIES.filter((property) => property.status === 'active').length
    const totalValue = PROPERTIES.reduce((total, property) => total + property.value, 0)
    const averageYield = PROPERTIES.reduce((total, property) => total + property.yield, 0) / PROPERTIES.length

    return {
      active,
      totalValue,
      averageYield,
    }
  }, [])

  const resetListing = () => {
    setListingForm({ ...DEFAULT_FORM })
    setListingStep(1)
    setListingOpen(false)
  }

  const handleDistribution = () => {
    setTxOpen(true)
    setTimeout(() => {
      setTxOpen(false)
      showToast('Rent distribution complete', 'Income delivered to 347 investors · 🔒', 'success')
    }, 6500)
  }

  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="mx-auto max-w-8xl px-4 sm:px-6">
        <AdminHeader />
        <AdminTabs tab={tab} onTabChange={setTab} />

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            {tab === 'properties' && (
              <AdminPropertiesPanel
                properties={PROPERTIES}
                summary={summary}
                onOpenListing={() => setListingOpen(true)}
              />
            )}
            {tab === 'rent' && (
              <AdminRentPanel
                properties={PROPERTIES}
                selectedPropertyId={selectedPropertyId}
                selectedPropertyName={selectedProperty.name}
                depositAmount={depositAmount}
                depositValue={depositValue}
                platformFee={platformFee}
                reserve={reserve}
                distributable={distributable}
                onSelectedPropertyIdChange={setSelectedPropertyId}
                onDepositAmountChange={setDepositAmount}
                onTriggerDistribution={handleDistribution}
              />
            )}
            {tab === 'registry' && <AdminRegistryPanel rows={REGISTRY_ROWS} />}
            {tab === 'analytics' && <AdminAnalyticsPanel properties={PROPERTIES} summary={summary} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <ListingWizardModal
        isOpen={listingOpen}
        listingStep={listingStep}
        listingForm={listingForm}
        setListingStep={setListingStep}
        setListingForm={setListingForm}
        resetListing={resetListing}
      />

      <TransactionModal
        isOpen={txOpen}
        onClose={() => setTxOpen(false)}
        txHash="0x7f3a1b2c4d5e6f7890abcdef1234567890abcd"
      />
    </div>
  )
}
