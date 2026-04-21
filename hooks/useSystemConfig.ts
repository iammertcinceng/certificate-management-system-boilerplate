
import { useState, useEffect } from 'react';

export function useSystemConfig() {
    const [supportEmail, setSupportEmail] = useState('mertcin0@outlook.com');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/system-config');
                if (res.ok) {
                    const data = await res.json();
                    if (data.supportEmail) {
                        setSupportEmail(data.supportEmail);
                    }
                }
            } catch (err) {
                console.error('Failed to load system config', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return { supportEmail, loading };
}
