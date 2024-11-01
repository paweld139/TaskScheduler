import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    Calendar,
    dateFnsLocalizer,
    Event,
    SlotInfo
} from 'react-big-calendar';

import withDragAndDrop, {
    EventInteractionArgs
} from 'react-big-calendar/lib/addons/dragAndDrop';

import {
    format,
    parse,
    startOfWeek,
    getDay
} from 'date-fns';

import {
    enUS
} from 'date-fns/locale';

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import 'react-big-calendar/lib/css/react-big-calendar.css';

import {
    addEvent,
    deleteEvent,
    getEvents,
    updateEvent
} from './requests';

import 'bootstrap/dist/css/bootstrap.min.css';

import {
    Container
} from 'reactstrap';

const locales = {
    'en-US': enUS
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales
});

import AppModal from './components/AppModal';

import AppForm from './components/AppForm';

import {
    FormButton,
    FormInput,
    ModalSettings
} from './interfaces';

const DnDCalendar = withDragAndDrop(Calendar);

const App = () => {
    const [events, setEvents] = useState<Event[]>();

    const [eventToAddOrEdit, setEventToAddOrEdit] = useState<Event>({});

    const [modalSettings, setModalSettings] = useState<ModalSettings>({
        header: '',
        buttonLabel: '',
        isOpen: false,
        isAdding: false
    });

    const populateEvents = useCallback(async () => {
        const dataToSet = await getEvents();

        if (dataToSet)
            setEvents(dataToSet);
    }, []);

    const moveEvent = useCallback(async (data: EventInteractionArgs<Event>) => {
        const changedEvent = events?.find(event => event.resource === data.event.resource);

        if (changedEvent) {
            changedEvent.start = data.start as Date;

            changedEvent.end = data.end as Date;

            await updateEvent(changedEvent);

            await populateEvents();
        }
    }, [events, populateEvents]);

    const setModalIsOpen = useCallback((isOpen: boolean) => {
        setModalSettings(prevState => ({
            ...prevState,
            isOpen
        }));
    }, []);

    const hideModal = useCallback(() => {
        setModalIsOpen(false);
    }, [setModalIsOpen]);

    const prepareAddEvent = useCallback((e: SlotInfo) => {
        setEventToAddOrEdit({
            title: '',
            start: e.start,
            end: e.end
        });

        setModalSettings({
            header: 'Add Event',
            buttonLabel: 'Add',
            isOpen: true,
            isAdding: true
        });
    }, []);

    const prepareEditEvent = useCallback((event: Event) => {
        setEventToAddOrEdit(event);

        setModalSettings({
            header: 'Edit Event',
            buttonLabel: 'Edit',
            isOpen: true,
            isAdding: false
        });
    }, []);

    const executeDeleteEvent = useCallback(async () => {
        await deleteEvent(eventToAddOrEdit);

        await populateEvents();

        hideModal();
    }, [eventToAddOrEdit, populateEvents, hideModal]);

    const onSubmit = useCallback(async () => {
        if (modalSettings.isAdding) {
            await addEvent(eventToAddOrEdit);
        } else {
            await updateEvent(eventToAddOrEdit);
        }

        await populateEvents();

        hideModal();
    }, [eventToAddOrEdit, hideModal, modalSettings.isAdding, populateEvents]);

    useEffect(() => {
        populateEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const inputs = useMemo<FormInput<Event>[]>(() => [
        {
            key: 'title',
            label: 'Title'
        },
        {
            key: 'start',
            label: 'Start',
            type: 'datetime-local'
        },
        {
            key: 'end',
            label: 'End',
            type: 'datetime-local'
        },
        {
            key: 'allDay',
            label: 'All Day',
            type: 'checkbox'
        }
    ], []);

    const additionalButtons = useMemo<FormButton[] | undefined>(() => modalSettings.isAdding ? undefined : [
        {
            label: 'Delete',
            onClick: executeDeleteEvent,
            color: 'danger'
        }
    ], [modalSettings.isAdding, executeDeleteEvent]);

    return events && (
        <Container fluid>
            <DnDCalendar
                defaultView='week'
                events={events}
                localizer={localizer}
                onEventDrop={moveEvent}
                onEventResize={moveEvent}
                onSelectSlot={prepareAddEvent}
                onSelectEvent={prepareEditEvent}
                resizable
                selectable
                style={{ height: '100vh' }}
            />

            <AppModal
                header={modalSettings.header}
                isOpen={modalSettings.isOpen}
                setIsOpen={setModalIsOpen}
            >
                <AppForm
                    inputs={inputs}
                    data={eventToAddOrEdit}
                    setData={setEventToAddOrEdit}
                    buttonLabel={modalSettings.buttonLabel}
                    onSubmit={onSubmit}
                    additionalButtons={additionalButtons}
                />
            </AppModal>
        </Container>
    );
}

export default App;