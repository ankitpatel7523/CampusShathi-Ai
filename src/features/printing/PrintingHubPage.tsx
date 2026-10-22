import React, { useState, useEffect } from 'react';
import { 
  Printer, Truck, Clock, ShieldCheck, FileText, CheckCircle2, 
  MapPin, Phone, AlertCircle, Sparkles, ChevronRight, RefreshCw, Layers
} from 'lucide-react';
import { apiClient } from '../../services/api-client.js';
import { PrintOrder } from '../../../shared/types/index.js';
import confetti from 'canvas-confetti';

interface PrintingHubPageProps {
  initialDocument?: { documentTitle: string; pages: number } | null;
}

export const PrintingHubPage: React.FC<PrintingHubPageProps> = ({ initialDocument }) => {
  const [activeTab, setActiveTab] = useState<'new_order' | 'track_orders'>('new_order');
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Form State
  const [documentTitle, setDocumentTitle] = useState(initialDocument?.documentTitle || 'Operating Systems Lab Manual & Code.pdf');
  const [pages, setPages] = useState<number>(initialDocument?.pages || 32);
  const [copies, setCopies] = useState<number>(1);
  const [colorMode, setColorMode] = useState<'bw' | 'color'>('bw');
  const [printSides, setPrintSides] = useState<'single' | 'double'>('double');
  const [bindingType, setBindingType] = useState<'staple' | 'spiral' | 'hardbound'>('spiral');
  const [urgency, setUrgency] = useState<'regular' | 'express_morning_9am'>('express_morning_9am');
  const [hostelDeliveryAddress, setHostelDeliveryAddress] = useState('Hostel BH-3, Room 214, North Campus');
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    if (initialDocument) {
      if (initialDocument.documentTitle) setDocumentTitle(initialDocument.documentTitle);
      if (initialDocument.pages) setPages(initialDocument.pages);
      setActiveTab('new_order');
    }
  }, [initialDocument]);

  // Live Price Calculation
  const [priceBreakdown, setPriceBreakdown] = useState({
    printingSubtotal: 25.6,
    bindingCost: 25,
    expressFee: 15,
    platformDeliveryFee: 10,
    pageRate: 0.8,
    totalAmount: 75.6
  });

  const updatePrice = async () => {
    try {
      const res = await apiClient.calculatePrintPrice({
        pages,
        copies,
        colorMode,
        printSides,
        bindingType,
        urgency
      });
      setPriceBreakdown(res);
    } catch (err) {
      console.error('Failed to calculate price', err);
    }
  };

  useEffect(() => {
    updatePrice();
  }, [pages, copies, colorMode, printSides, bindingType, urgency]);

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await apiClient.getPrintOrders();
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'track_orders') {
      loadOrders();
    }
  }, [activeTab]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentTitle || !hostelDeliveryAddress || !phoneNumber) {
      alert('Please fill in all required delivery details');
      return;
    }

    try {
      setSubmittingOrder(true);
      await apiClient.createPrintOrder({
        documentTitle,
        pages,
        copies,
        colorMode,
        printSides,
        bindingType,
        hostelDeliveryAddress,
        phoneNumber,
        urgency
      });

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setActiveTab('track_orders');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to place order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Value Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white p-6 md:p-8 shadow-lg shadow-indigo-500/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <Truck className="w-3.5 h-3.5 text-blue-200" />
            <span>Campus Hostel Delivery • Before 9:00 AM ⚡</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Smart Campus Print Hub
          </h1>
          <p className="mt-2 text-white/90 text-sm md:text-base leading-relaxed">
            Stop standing in long photocopy queues before lab sessions! Upload your lab manuals or notes, choose your binding, and get it delivered directly to your hostel room.
          </p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setActiveTab('new_order')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'new_order' ? 'bg-white text-indigo-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Order New Print
            </button>
            <button
              onClick={() => setActiveTab('track_orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'track_orders' ? 'bg-white text-indigo-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Track Deliveries ({orders.length || 2})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'new_order' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Configurator Form */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-5">
            {/* Step 1: Document Details */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Document & Page Count
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document / File Name
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="e.g. Operating Systems Lab Manual Unit 1-5"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Pages Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={pages}
                    onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Auto-detected from PDF</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Copies Needed
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setCopies(Math.max(1, copies - 1))}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-l-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      readOnly
                      value={copies}
                      className="w-12 py-2 text-center text-xs font-bold border-y border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCopies(copies + 1)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-r-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Print & Binding Options */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Paper, Color & Binding Options
                </h3>
              </div>

              {/* Color Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Color Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setColorMode('bw')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      colorMode === 'bw'
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">Black & White</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">₹0.80 / page (Best for Notes)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setColorMode('color')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      colorMode === 'color'
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">Full Color</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">₹2.20 / page (Charts & Reports)</div>
                  </button>
                </div>
              </div>

              {/* Sides */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Printing Sides
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPrintSides('double')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      printSides === 'double'
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">Back-to-Back (Duplex)</div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Recommended (Saves 20% Cost)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintSides('single')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      printSides === 'single'
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">Single Sided</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Formal project reports</div>
                  </button>
                </div>
              </div>

              {/* Binding Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Binding Style
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'staple', label: 'Corner Staple', cost: 'Free' },
                    { id: 'spiral', label: 'Spiral Bound', cost: '+₹25' },
                    { id: 'hardbound', label: 'Hard Bound', cost: '+₹120' }
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBindingType(b.id as any)}
                      className={`p-2.5 rounded-lg border text-center transition cursor-pointer ${
                        bindingType === b.id
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>{b.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">{b.cost}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3: Delivery Address & Urgency */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Hostel Delivery Details
                </h3>
              </div>

              {/* Urgency */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUrgency('express_morning_9am')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    urgency === 'express_morning_9am'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-600 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    ⚡ Before 9:00 AM Lab
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Delivered to Hostel Gate (+₹15)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency('regular')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    urgency === 'regular'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs">Standard Campus Pickup</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">College Canteen by 1:00 PM (Free)</div>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hostel / Room No. / College Delivery Point *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={hostelDeliveryAddress}
                    onChange={(e) => setHostelDeliveryAddress(e.target.value)}
                    placeholder="e.g. Boys Hostel BH-3, Room 214, North Block"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Contact Phone (For Delivery Ping) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Right Summary & Checkout Sticky Card */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                  Live Calculator
                </span>
              </h3>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex justify-between">
                  <span>Printing ({pages} pages × {copies} copy @ ₹{priceBreakdown.pageRate}/p):</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    ₹{priceBreakdown.printingSubtotal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Binding ({bindingType}):</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    ₹{priceBreakdown.bindingCost}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Urgency Express:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    ₹{priceBreakdown.expressFee}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Hostel Delivery Runner Fee:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    ₹{priceBreakdown.platformDeliveryFee}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs text-slate-500 block">Total Amount</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ₹{priceBreakdown.totalAmount}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-600 font-semibold block">⚡ 9:00 AM Delivery</span>
                  <span className="text-[10px] text-slate-400">Guaranteed before morning lab</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={submittingOrder}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                {submittingOrder ? 'Processing...' : `Place Print Order (₹${priceBreakdown.totalAmount})`}
              </button>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Campus Quality Assurance</span>
                </div>
                <p>75 GSM premium bright paper. Spiral coil bound with transparent front protective PVC sheet.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Orders Tracking Stepper Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Active & Past Print Deliveries
            </h2>
            <button
              onClick={loadOrders}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>

          <div className="space-y-4">
            {orders.map((order) => {
              const statusSteps = ['order_placed', 'printing', 'out_for_delivery', 'delivered'];
              const currentStepIdx = statusSteps.indexOf(order.order_status);

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          #{order.id}
                        </span>
                        <span className="text-xs text-slate-500">• {order.document_title}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {order.pages} pages • {order.copies} copy • {order.color_mode.toUpperCase()} • {order.binding_type} binding
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                          ₹{order.total_amount}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium">Paid via UPI</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Location & Timing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate">{order.hostel_delivery_address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Estimated: {order.estimated_delivery}</span>
                    </div>
                  </div>

                  {/* Visual Progress Stepper */}
                  <div className="pt-2">
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {[
                        { key: 'order_placed', label: '1. Order Placed' },
                        { key: 'printing', label: '2. Printing at Shop' },
                        { key: 'out_for_delivery', label: '3. Out for Delivery' },
                        { key: 'delivered', label: '4. Delivered' }
                      ].map((step, idx) => {
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        return (
                          <div key={step.key} className="space-y-1.5">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isDone ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                              } ${isCurrent ? 'ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                            />
                            <span
                              className={`text-[11px] block font-medium ${
                                isCurrent
                                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                                  : isDone
                                  ? 'text-slate-800 dark:text-slate-200'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
